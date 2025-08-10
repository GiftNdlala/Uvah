from django.contrib import admin
from .models import Alert, AlertLocation

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'severity_level', 'trigger_count', 'trigger_source', 'created_at')
    search_fields = ('id', 'trigger_source', 'status')
    list_filter = ('status', 'severity_level')

@admin.register(AlertLocation)
class AlertLocationAdmin(admin.ModelAdmin):
    list_display = ('alert', 'lat', 'lon', 'accuracy', 'captured_at')
    list_filter = ('captured_at',)
    search_fields = ('alert__id',)