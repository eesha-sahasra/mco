#FROM python:3
# RUN apt insall -y python3-pip
FROM ubuntu:focal
ENV TZ=Asia/Singapore
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update
RUN apt install -y python3-pip

RUN apt install -y stress-ng

RUN pip3 install Flask
RUN pip3 install flask-cors
RUN pip3 install opencv-python-headless

COPY . /vs
WORKDIR /vs

EXPOSE 5006

#ENV FLASK_APP=server.py

CMD ["python3", "server.py"]
