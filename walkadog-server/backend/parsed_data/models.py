from django.db import models

#서울시 애견카페 정보 파싱 데이터 모음.
class CafeInfo(models.Model):
    cafeTitles = models.CharField(max_length=100)
    cafeCallNums = models.CharField(max_length=100)
    cafeImgs = models.CharField(max_length=500)
    cafeAddrs = models.CharField(max_length=100)

    def __str__(self):
        #객체를 출력할 때 나타날 값
        return "cafeTitle :"+self.cafeTitle + "cafeCallNum :" +self.cafeCallNums +", cafeImg: " + self.cafeImgs + ", cafeAddr: " + self.cafeAddr

#서울시 미세먼지 정보 파싱 데이터 모음.
class microDustInfo(models.Model):
    측정시간 = models.CharField(max_length=100)
    종로 = models.IntegerField()
    중구 = models.IntegerField()
    용산 = models.IntegerField()
    성동 = models.IntegerField()
    광진 = models.IntegerField()
    동대문 = models.IntegerField()
    중랑 = models.IntegerField()
    성북 = models.IntegerField()
    강북 = models.IntegerField()
    도봉 = models.IntegerField()
    노원 = models.IntegerField()
    은평 = models.IntegerField()
    서대문 = models.IntegerField()
    마포 = models.IntegerField()
    양천 = models.IntegerField()
    강서 = models.IntegerField()
    구로 = models.IntegerField()
    금천 = models.IntegerField()
    영등포 = models.IntegerField()
    동작 = models.IntegerField()
    관악 = models.IntegerField()
    서초 = models.IntegerField()
    강남 = models.IntegerField()
    송파 = models.IntegerField()
    강동 = models.IntegerField()
