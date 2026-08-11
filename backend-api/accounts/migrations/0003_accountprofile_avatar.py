from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_accountprofile'),
    ]

    operations = [
        migrations.AddField(
            model_name='accountprofile',
            name='avatar',
            field=models.ImageField(blank=True, null=True, upload_to='avatars/%Y/%m/'),
        ),
    ]
