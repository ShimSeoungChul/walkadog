#backend/post/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path('VodInfo', views.ListVodInfo.as_view()),
    path('VodInfo/<int:pk>/', views.DetailVodInfo.as_view()),
    path('CafeInfo', views.ListCafeInfo.as_view()),
    path('CafeInfo/<int:pk>/', views.DetailCafeInfo.as_view()),
    path('MicroDustInfo', views.ListmicroDustInfo.as_view()),
    path('MicroDustInfo/<int:pk>/', views.DetailmicroDustInfo.as_view()),
]
