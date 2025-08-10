from rest_framework import serializers
from .models import Alert, AlertLocation

class AlertCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['id', 'severity_level', 'trigger_count', 'trigger_source', 'message']

class AlertResponseSerializer(serializers.ModelSerializer):
    share_url = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = ['id', 'severity_level', 'trigger_count', 'trigger_source', 'status', 'live_view_token', 'share_url', 'created_at']

    def get_share_url(self, obj):
        request = self.context.get('request')
        base = f"{request.scheme}://{request.get_host()}" if request else ''
        return f"{base}/live/{obj.live_view_token}" if base else f"/live/{obj.live_view_token}"

class LocationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertLocation
        fields = ['lat', 'lon', 'accuracy']