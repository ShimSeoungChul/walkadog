#서울시 애견카페 정보,미세먼지 파싱을 위한 .py 파일입니다.


import requests as rq
import bs4
import threading
from bs4 import BeautifulSoup
# 아래 4줄을 추가해 줍니다.
import os
# Python이 실행될 때 DJANGO_SETTINGS_MODULE이라는 환경 변수에 현재 프로젝트의 settings.py파일 경로를 등록합니다.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "djangoreactapi.settings")
# 이제 장고를 가져와 장고 프로젝트를 사용할 수 있도록 환경을 만듭니다.
import django
django.setup()

# CafeInfo를 import해옵니다
from parsed_data.models import CafeInfo, microDustInfo

#서울시 구에 따라 애견카페 정보를 나타내는 네이버 html 폼이 다릅니다.
#이러한 이유로 2가지 html 폼에 따라 크롤링을 진행합니다.
Places1 = ["도봉구","강북구","은평구","중랑구","서대문구","강서구", "마포구","중구",\
"광진구","영등포구","용산구","구로구","동작구","강남구","관악구","금천구"]
Places2 = ["노원구","종로구","성북구","동대문구","성동구","양천구","송파구","서초구"]

#Places1 딕셔너리에 포함된 '구'에 위치한 애견카페를 크롤링하는 함수
def places1_get():
    #각 구들 마다 크롤링을 진행하기 위한 반복문
    for i in range(0,len(Places1)):
        url = "https://search.naver.com/search.naver?sm=tab_hty.top&where=nexearch&query="+Places1[i]+"+애견카페"
        res = rq.get(url)
        soup = BeautifulSoup(res.content,"lxml") #Python HTML parser

        titles = soup.select('span.tit_inner > a') #['title'],['href'] #카페 이름, 카페 상세페이지 url 가져오기


        #파싱한 카페 개수만큼 반복문 실행. 각 데이터 요소를 DB에 저장합니다.
        for j in range(0,len(titles)):
            detail_url = titles[j]['href']
            detail_res = rq.get(detail_url) #카페 주소 파싱하기
            soup = BeautifulSoup(detail_res.content,"lxml") #Python HTML parser

            detail_title = titles[j]['title']
            print(detail_title) #카페 이름 출력

            #카페 이미지가 있을 경우 출력, 없을 경우 변수에 'none'문자열 할당
            if soup.select('div.thumb > img'):
                img_pars=soup.select('div.thumb > img') #카페 이미지 파싱
                detail_img = img_pars[0].get('src')
                print(detail_img)
            else:
                detail_img = 'none'
                print(detail_img)
            #카페 전화번호가 있을 경우 출력, 없을 경우 변수에 'none'문자열 할당
            if soup.select('div.list_item.list_item_biztel > div.txt') :
                detail_call=soup.select('div.list_item.list_item_biztel > div.txt')[0].text # 카페 전화번호 파싱
                print(detail_call)
            else:
                detail_call = 'none'
                print(detail_call)

            #카페 주소가 있을 경우 출력, 없을 경우 변수에 'none'문자열 할당
            if soup.select('li > span.addr') :
                detail_addr=soup.select('li > span.addr')[0].text #카페 주소 파싱
                print(detail_addr)
            else :
                detail_addr = 'none'
                print(detail_addr)

            CafeInfo(cafeTitles=detail_title,cafeCallNums=detail_call,cafeImgs=detail_img,cafeAddrs=detail_addr).save()

#Places2 딕셔너리에 포함된 '구'에 위치한 애견카페를 크롤링하는 함수
def places2_get():
    #각 구들 마다 크롤링을 진행하기 위한 반복문
    for i in range(0,len(Places2)):
        url = "https://search.naver.com/search.naver?sm=tab_hty.top&where=nexearch&query="+Places2[i]+"+애견카페"
        res = rq.get(url)
        soup = BeautifulSoup(res.content,"lxml") #Python HTML parser

        titles = soup.select('dl.info_area > dt > a') #['title'],['href'] #카페 이름, 카페 상세페이지 url 가져오기

#파싱한 카페 개수만큼 반복문 실행. 각 데이터 요소를 DB에 저장합니다.
        for j in range(0,len(titles)):
            #카페 상세 페이지 url을 가져와서. 해당 url로 바로 접속하면 크롤링을
            #할 수 없는 화면으로 이동한다. url의 code data를 통해 우회 접속한다.
            #카페 상세 페이지에 접속하기 위한 code data를 split해서 변수에 저장한다.
            split_url = titles[j]['href'];
            url_split = split_url.split('code=')
            #우회 접속할 접속 url
            detail_url ="https://store.naver.com/restaurants/detail?id="+url_split[1]+"&tab=photo"
            detail_res = rq.get(detail_url) #카페 주소 파싱하기
            soup = BeautifulSoup(detail_res.content,"lxml") #Python HTML parser

            detail_title = titles[j]['title']
            print(detail_title) #카페 이름 출력

            #카페 이미지가 있을 경우 출력, 없을 경우 변수에 'none'문자열 할당
            if soup.select('div.thumb > img'):
                img_pars=soup.select('div.thumb > img') #카페 이미지 파싱
                detail_img = img_pars[0].get('src')
                print(detail_img)
            else:
                detail_img = 'none'
                print(detail_img)

            #카페 전화번호가 있을 경우 출력, 없을 경우 변수에 'none'문자열 할당
            if soup.select('div.list_item.list_item_biztel > div.txt')[0].text :
                detail_call=soup.select('div.list_item.list_item_biztel > div.txt')[0].text # 카페 전화번호 파싱
                print(detail_call)
            else:
                detail_call = 'none'
                print(detail_call)

            #카페 주소가 있을 경우 출력, 없을 경우 변수에 'none'문자열 할당
            if soup.select('li > span.addr')[0].text :
                detail_addr=soup.select('li > span.addr')[0].text #카페 주소 파싱
                print(detail_addr)
            else :
                detail_addr = 'none'
                print(detail_addr)

        CafeInfo(cafeTitles=detail_title,cafeCallNums=detail_call,cafeImgs=detail_img,cafeAddrs=detail_addr).save()


#서울시 각 구의 미세먼지 농도를 크롤링하는 함수
def microDustInfoGet_func(second):
    url = "https://search.naver.com/search.naver?where=nexearch&sm=tab_etc&mra=blQ3&query=%EC%84%9C%EC%9A%B8%20%EB%AF%B8%EC%84%B8%EB%A8%BC%EC%A7%80"
    res = rq.get(url)
    soup = BeautifulSoup(res.content,"lxml") #Python HTML parser

    wheres = soup.select('div.main_box > div.map_area.ct09 > a > span.cityname') # 서울시 각 구 이름 크롤링
    values = soup.select('div.main_box > div.map_area.ct09 > a > span.value > em') # 서울시 각 구의 미세먼지 농도 크롤링
    when =  soup.select('div.info_box > div.guide_bx > div.guide > span.update > em')[0].text# 미세먼지 측정 시간 기록

    for i in range(0,len(wheres)):
        print(wheres[i].text)
        print(values[i].text)
    # 서울시 각 구의 미세먼지 데이터를 저장한다.
    #저장하는 순서는 다음과 같다. 1.종로 2.중구 3.용산 4.성동 5.광진 6.동대문 7.중랑 8.성북 9.강북 10.도봉 11.노원 12.은평
    # 13.서대문 14.마포 15.양천 16.강서 17.구로 18.금천 19.영등포 20.동작 21.관악 22.서초 23.강남 24.송파 25.강동

        #배열 인덱스 i에 따라 서울시의 각 구의 미세먼지 농도를 db에 입력하는 switch
    microDustInfo(측정시간=when,종로=values[0].text,중구=values[1].text,용산=values[2].text,성동=values[3].text,\
    광진=values[4].text,동대문=values[5].text,중랑=values[6].text,성북=values[7].text,강북=values[8].text,도봉=values[9].text,\
    노원=values[10].text,은평=values[11].text,서대문=values[12].text,마포=values[13].text,양천=values[14].text,\
    강서=values[15].text,구로=values[16].text,금천=values[17].text,영등포=values[18].text,동작=values[19].text,\
    관악=values[20].text,서초=values[21].text,강남=values[22].text,송파=values[23].text,강동=values[24].text).save()

    threading.Timer(second, microDustInfoGet_func, [second]).start()


# 이 명령어는 이 파일이 import가 아닌 python에서 직접 실행할 경우에만 아래 코드가 동작하도록 합니다.
if __name__=='__main__':
    microDustInfoGet_func(3600.0)
