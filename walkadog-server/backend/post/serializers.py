#backend/post/serializers.py
from rest_framework import serializers
from .models import VodInfo
from parsed_data.models import CafeInfo, microDustInfo

class VodInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VodInfo
        fields = '__all__'

class CafeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CafeInfo
        fields = '__all__'

class microDustInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = microDustInfo
        fields = '__all__'
