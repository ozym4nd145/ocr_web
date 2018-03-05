FROM jbarlow83/ocrmypdf-tess4:latest
MAINTAINER Suyash Agrawal <ozym4nd145@outlook.com>
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
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

ENV PROJECT_DIR=/home/docker/app \
    UPLOAD_DIR=/home/docker/app/uploads \
    APP_PORT=3000

WORKDIR $PROJECT_DIR
VOLUME $UPLOAD_DIR

COPY package.json $PROJECT_DIR
RUN npm install

COPY . $PROJECT_DIR

EXPOSE $APP_PORT 

ENTRYPOINT ["/home/docker/app/docker_wrapper.sh"]

