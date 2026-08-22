import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { findNodeHandle, Linking, Modal, NativeModules, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import MapAvatarMarker from './MapAvatarMarker';
import { computeMapRegion, DEFAULT_REGION, normalizeCoordinatePair } from '../utils/location';

const TrustedCircleMap = ({
  userLocation,
  friendLocations = [],
  extraMarkers = [],
  style,
  mapStyle,
  showsUserLocation = true,
  showFriends = true,
  showUserMarker = true,
  focusedLocation,
  showsMyLocationButton = true,
}) => {
  const mapRef = useRef(null);
  const latestMapMarkers = useRef([]);
  const projectionInFlight = useRef(false);
  const projectionPending = useRef(false);
  const projectionRequestId = useRef(0);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [nativeProjectedMarkers, setNativeProjectedMarkers] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const normalizedUserLocation = useMemo(() => normalizeCoordinatePair(userLocation), [userLocation]);
  const normalizedFriendLocations = useMemo(
    () =>
      friendLocations
        .map((loc) => ({ ...loc, ...(normalizeCoordinatePair(loc) || {}) }))
        .filter((loc) => loc.latitude != null && loc.longitude != null),
    [friendLocations],
  );
  const normalizedExtraMarkers = useMemo(
    () =>
      extraMarkers
        .map((pin) => ({ ...pin, ...(normalizeCoordinatePair(pin) || {}) }))
        .filter((pin) => pin.latitude != null && pin.longitude != null),
    [extraMarkers],
  );
  const hasUserCoords = normalizedUserLocation?.latitude != null && normalizedUserLocation?.longitude != null;

  const initialRegion = useMemo(
    () => computeMapRegion(normalizedUserLocation, showFriends ? normalizedFriendLocations : [], DEFAULT_REGION),
    [normalizedUserLocation, showFriends, normalizedFriendLocations],
  );
  const [visibleRegion, setVisibleRegion] = useState(initialRegion);

  const mapMarkers = useMemo(() => {
    const markers = [];
    if (hasUserCoords && showUserMarker) {
      markers.push({
        id: 'user',
        coordinate: {
          latitude: normalizedUserLocation.latitude,
          longitude: normalizedUserLocation.longitude,
        },
        avatarUrl: userLocation?.avatarUrl,
        fallbackLetter: 'Y',
        borderColor: '#2aa8f2',
        title: 'You',
      });
    }

    if (showFriends) {
      normalizedFriendLocations.forEach((loc) => {
        markers.push({
          id: `friend-${loc.user?.id ?? `${loc.latitude}-${loc.longitude}`}`,
          kind: 'friend',
          coordinate: { latitude: loc.latitude, longitude: loc.longitude },
          avatarUrl: loc.user?.avatar_url,
          fallbackLetter: loc.user?.username?.charAt(0)?.toUpperCase() || 'F',
          borderColor: '#3ecf8e',
          isStale: loc.is_stale,
          title: `@${loc.user?.username || 'friend'}`,
          updatedAt: loc.updated_at,
        });
      });
    }

    normalizedExtraMarkers.forEach((pin) => {
      markers.push({
        id: `extra-${pin.id}`,
        coordinate: { latitude: pin.latitude, longitude: pin.longitude },
        fallbackLetter: '',
        borderColor: pin.color || '#f5a623',
        title: pin.label,
      });
    });

    return markers;
  }, [hasUserCoords, normalizedExtraMarkers, normalizedFriendLocations, normalizedUserLocation, showFriends, showUserMarker, userLocation]);

  const markerSetSignature = useMemo(
    () => mapMarkers.map((marker) => marker.id).sort().join('|'),
    [mapMarkers],
  );
  latestMapMarkers.current = mapMarkers;

  // Android's AirMapModule uses GoogleMap.Projection.toScreenLocation(), which
  // stays accurate for tilt, zoom, bearing, and every camera animation. Region
  // deltas are only an approximation on the legacy Google renderer.
  const refreshMarkerProjection = useCallback(() => {
    if (Platform.OS !== 'android' || !mapSize.width || !mapSize.height) return;

    if (projectionInFlight.current) {
      projectionPending.current = true;
      return;
    }

    const mapTag = findNodeHandle(mapRef.current);
    const mapModule = NativeModules.RNMapsAirModule;
    if (!mapTag || !mapModule?.getPointForCoordinate) return;

    projectionInFlight.current = true;
    projectionPending.current = false;
    const requestId = ++projectionRequestId.current;

    const markersToProject = latestMapMarkers.current;
    Promise.all(markersToProject.map(async (marker) => ({
      ...marker,
      point: await mapModule.getPointForCoordinate(mapTag, marker.coordinate),
    })))
      .then((markers) => {
        if (requestId === projectionRequestId.current) setNativeProjectedMarkers(markers);
      })
      .catch(() => {
        // Preserve the existing visual fallback if a device lacks this bridge.
        if (requestId === projectionRequestId.current) setNativeProjectedMarkers(null);
      })
      .finally(() => {
        projectionInFlight.current = false;
        if (projectionPending.current) refreshMarkerProjection();
      });
  }, [mapSize.height, mapSize.width]);

  useEffect(() => {
    setVisibleRegion(initialRegion);
  }, [initialRegion]);

  useEffect(() => () => {
    // Ignore any projection promise which resolves after the map has gone away.
    projectionRequestId.current += 1;
    // Detach Google Maps boundaries before Android destroys the native view.
    const map = mapRef.current;
    if (map?.setMapBoundaries) {
      try {
        map.setMapBoundaries(null, null);
      } catch (_) {}
    }
    mapRef.current = null;
  }, []);

  const fitMap = () => {
    const coords = mapMarkers.map((marker) => marker.coordinate);
    if (coords.length > 1 && mapRef.current?.fitToCoordinates) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    } else if (coords.length === 1 && mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion({
        latitude: coords[0].latitude,
        longitude: coords[0].longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }, 400);
    }
  };

  useEffect(() => {
    const t = setTimeout(fitMap, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerSetSignature]);

  useEffect(() => {
    refreshMarkerProjection();
  }, [mapMarkers, refreshMarkerProjection]);

  useEffect(() => {
    if (focusedLocation?.latitude != null && focusedLocation?.longitude != null && mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion({
        latitude: Number(focusedLocation.latitude),
        longitude: Number(focusedLocation.longitude),
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }, 500);
    }
  }, [focusedLocation]);

  const fallbackProjectedMarkers = useMemo(() => {
    if (!mapSize.width || !mapSize.height || !visibleRegion?.latitudeDelta || !visibleRegion?.longitudeDelta) return [];

    return mapMarkers
      .map((marker) => ({
        ...marker,
        rawPoint: {
          x: mapSize.width / 2 + ((marker.coordinate.longitude - visibleRegion.longitude) / visibleRegion.longitudeDelta) * mapSize.width,
          y: mapSize.height / 2 - ((marker.coordinate.latitude - visibleRegion.latitude) / visibleRegion.latitudeDelta) * mapSize.height,
        },
      }))
      .filter(({ rawPoint }) => rawPoint.x > -44 && rawPoint.x < mapSize.width + 44 && rawPoint.y > -44 && rawPoint.y < mapSize.height + 44)
      .map(({ rawPoint, ...marker }) => ({
        ...marker,
        point: {
          x: Math.min(Math.max(rawPoint.x, 48), mapSize.width - 48),
          y: Math.min(Math.max(rawPoint.y, 48), mapSize.height - 48),
        },
      }));
  }, [mapMarkers, mapSize, visibleRegion]);

  const projectedMarkers = nativeProjectedMarkers ?? fallbackProjectedMarkers;

  const lastUpdatedLabel = (updatedAt) => {
    const timestamp = new Date(updatedAt).getTime();
    if (!Number.isFinite(timestamp)) return 'Unavailable';
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    return new Date(updatedAt).toLocaleString();
  };

  const openFriendDirections = async () => {
    if (!selectedFriend) return;
    const { latitude, longitude } = selectedFriend.coordinate;
    const destination = encodeURIComponent(`${latitude},${longitude}`);
    await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`);
  };

  const shareFriendLocation = async () => {
    if (!selectedFriend) return;
    const { latitude, longitude } = selectedFriend.coordinate;
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    await Share.share({ message: `${selectedFriend.title}'s shared location: ${mapUrl}` });
  };

  const handlePanDrag = (event) => {
    const nativeEvent = event?.nativeEvent;
    const coordinate = nativeEvent?.coordinate;
    const position = nativeEvent?.position;
    if (!coordinate || !position || !mapSize.width || !mapSize.height) return;

    setVisibleRegion((previous) => ({
      ...previous,
      latitude: coordinate.latitude + ((mapSize.height / 2 - position.y) / mapSize.height) * previous.latitudeDelta,
      longitude: coordinate.longitude - ((position.x - mapSize.width / 2) / mapSize.width) * previous.longitudeDelta,
    }));
    refreshMarkerProjection();
  };

  return (
    <View
      style={[styles.wrap, style]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setMapSize((previous) => (previous.width === width && previous.height === height ? previous : { width, height }));
      }}
    >
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        googleRenderer="LEGACY"
        style={[styles.map, mapStyle]}
        initialRegion={initialRegion}
        showsUserLocation={showsUserLocation && hasUserCoords}
        showsMyLocationButton={showsMyLocationButton && showsUserLocation && hasUserCoords}
        showsCompass
        zoomControlEnabled
        toolbarEnabled={false}
        scrollEnabled
        zoomEnabled
        rotateEnabled
        pitchEnabled
        onMapReady={() => {
          fitMap();
          setTimeout(refreshMarkerProjection, 0);
          // fitToCoordinates is animated, so project once more after its camera
          // transition even if the legacy renderer skips a region event.
          setTimeout(refreshMarkerProjection, 450);
        }}
        onRegionChange={(region) => {
          setVisibleRegion(region);
          refreshMarkerProjection();
        }}
        onRegionChangeComplete={(region) => {
          setVisibleRegion(region);
          refreshMarkerProjection();
        }}
        onPanDrag={handlePanDrag}
      />

      <View pointerEvents="box-none" style={styles.overlayLayer}>
        {projectedMarkers.map(({ id, point, ...marker }) => (
          <MapAvatarMarker
            key={id}
            {...marker}
            style={[styles.overlayMarker, { left: point.x - 22, top: point.y - 22 }]}
            onPress={marker.kind === 'friend' ? () => setSelectedFriend(marker) : undefined}
            accessibilityLabel={marker.kind === 'friend' ? `Open ${marker.title}'s location options` : undefined}
          />
        ))}
      </View>

      <Modal
        visible={Boolean(selectedFriend)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFriend(null)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedFriend(null)} />
          <View style={styles.friendSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{selectedFriend?.title}</Text>
            <Text style={styles.sheetMeta}>Last updated: {lastUpdatedLabel(selectedFriend?.updatedAt)}</Text>
            {selectedFriend?.isStale ? <Text style={styles.staleNotice}>This shared location may no longer be current.</Text> : null}
            <Pressable style={styles.primaryAction} onPress={openFriendDirections}>
              <Text style={styles.primaryActionText}>Go to friend’s location</Text>
            </Pressable>
            <Pressable style={styles.secondaryAction} onPress={shareFriendLocation}>
              <Text style={styles.secondaryActionText}>Share coordinates</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayMarker: {
    position: 'absolute',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  friendSheet: {
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#0a1728',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    marginBottom: 18,
    backgroundColor: '#5f7186',
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '700',
  },
  sheetMeta: {
    color: '#b7c5d3',
    marginTop: 6,
  },
  staleNotice: {
    color: '#f5a623',
    marginTop: 8,
  },
  primaryAction: {
    alignItems: 'center',
    marginTop: 22,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2aa8f2',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryAction: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 13,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#47647d',
  },
  secondaryActionText: {
    color: '#d9ecfa',
    fontWeight: '700',
  },
});

export default TrustedCircleMap;
