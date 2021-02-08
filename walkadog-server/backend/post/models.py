
#backend/post/models.py
from django.db import models

class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()

    def __str__(self):
        """A string representation of the model."""
        return self.title

#walkadog 데이터베이스 vod 정보 모델
class VodInfo(models.Model):
    user = models.CharField(max_length=200)
    title = models.CharField(max_length=200)
    date = models.CharField(max_length=200)

    def __str__(self):
        #객체를 출력할 때 나타날 값
        return "이름 :"+self.user + ", VOD 이름: " + self.title + ", 녹화 시간: " + self.date
