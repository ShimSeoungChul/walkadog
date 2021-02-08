#backend/post/views.py
from django.shortcuts import render
from rest_framework import generics

from .models import VodInfo
from parsed_data.models import CafeInfo, microDustInfo
from .serializers import VodInfoSerializer, CafeInfoSerializer, microDustInfoSerializer

class ListVodInfo(generics.ListCreateAPIView):
    queryset = VodInfo.objects.all()
    serializer_class = VodInfoSerializer


class DetailVodInfo(generics.RetrieveUpdateDestroyAPIView):
    queryset = VodInfo.objects.all()
    serializer_class = VodInfoSerializer

class ListCafeInfo(generics.ListCreateAPIView):
    queryset = CafeInfo.objects.all()
    serializer_class = CafeInfoSerializer

class DetailCafeInfo(generics.RetrieveUpdateDestroyAPIView):
    queryset = CafeInfo.objects.all()
    serializer_class = CafeInfoSerializer

class ListmicroDustInfo(generics.ListCreateAPIView):
    queryset = microDustInfo.objects.all().order_by('-측정시간')[:1]
    serializer_class = microDustInfoSerializer

class DetailmicroDustInfo(generics.RetrieveUpdateDestroyAPIView):
    queryset = microDustInfo.objects.all()
    serializer_class = microDustInfoSerializer
