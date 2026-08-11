from django.db import migrations


def mark_orphan_alerts_resolved(apps, schema_editor):
    Alert = apps.get_model('alerts', 'Alert')
    Alert.objects.filter(user__isnull=True).exclude(status='resolved').update(status='resolved')


class Migration(migrations.Migration):

    dependencies = [
        ('alerts', '0002_alert_user'),
    ]

    operations = [
        migrations.RunPython(mark_orphan_alerts_resolved, migrations.RunPython.noop),
    ]

