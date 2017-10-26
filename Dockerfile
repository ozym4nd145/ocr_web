FROM jbarlow83/ocrmypdf-tess4
MAINTAINER Suyash Agrawal <ozym4nd145@outlook.com>

WORKDIR /home/docker/app
ADD . /home/docker/app

USER root
ADD https://github.com/tesseract-ocr/tessdata/raw/master/equ.traineddata \
    https://github.com/tesseract-ocr/tessdata_fast/raw/master/eng.traineddata \ 
    https://github.com/tesseract-ocr/tessdata_fast/raw/master/hin.traineddata \ 
    https://github.com/tesseract-ocr/tessdata_fast/raw/master/osd.traineddata \
    /usr/share/tesseract-ocr/4.00/tessdata/

RUN apt-get update \
    && apt-get autoremove -y \
    && apt-get install -y --no-install-recommends curl\
    && curl -sL https://deb.nodesource.com/setup_6.x | bash - \
    && apt-get install -y --no-install-recommends nodejs

RUN npm install

EXPOSE 3000 

ENTRYPOINT ["/home/docker/app/docker_wrapper.sh"]

