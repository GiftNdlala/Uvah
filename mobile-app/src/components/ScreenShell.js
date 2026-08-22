import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../theme/tokens';
import UvahBrandBar from './UvahBrandBar';

const ScreenShell = ({
  children,
  scroll = false,
  contentContainerStyle,
  style,
  bodyStyle,
  showBrand = true,
  includeBottomInset = true,
}) => {
  return (
    <SafeAreaView
      edges={includeBottomInset ? undefined : ['top', 'left', 'right']}
      style={[styles.safeArea, style]}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      <View style={[styles.body, bodyStyle]}>
        {showBrand ? <UvahBrandBar /> : null}

        {scroll ? (
          <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, contentContainerStyle]}>
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  body: {
    flex: 1,
    paddingHorizontal: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  orbTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#124061',
    top: -80,
    right: -70,
    opacity: 0.5,
  },
  orbBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#0f6a57',
    bottom: -120,
    left: -100,
    opacity: 0.26,
  },
});

export default ScreenShell;
