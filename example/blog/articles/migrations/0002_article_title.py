# Generated by Django 3.0.5 on 2021-04-10 19:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('articles', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='title',
            field=models.CharField(max_length=200, null=True, verbose_name='Title'),
        ),
    ]
