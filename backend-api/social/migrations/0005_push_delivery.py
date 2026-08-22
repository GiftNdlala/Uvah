from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('social', '0004_notification'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='push_attempts',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='notification',
            name='push_delivered_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='push_last_error',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='notification',
            name='push_next_attempt_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name='PushDevice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(max_length=512, unique=True)),
                ('device_id', models.CharField(max_length=128)),
                ('platform', models.CharField(choices=[('android', 'Android'), ('ios', 'iOS')], max_length=16)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_seen_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='push_devices', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddIndex(
            model_name='pushdevice',
            index=models.Index(fields=['user', 'is_active'], name='social_push_user_active_idx'),
        ),
    ]
