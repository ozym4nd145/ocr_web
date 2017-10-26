# Web OCR
---
## About
A web interface for OCR of multiple languages. It uses tesseract ocr in the
backend for processing.
Currently, pdf files and image files are supported. Also, only english and
hindi are currently added but other languages can be supported trivially

## Main Features
* Simple web based gui for OCR.
* Supports both pdf and image inputs
* High quality ocr using LSTM based version of Tesseract OCR
* Sends mail on job completion

## Requirements
* [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
* [OCRmyPDF](https://github.com/jbarlow83/OCRmyPDF)
* [img2pdf](https://gitlab.mister-muffin.de/josch/img2pdf)
* Sendgrid (for sending email)
* AWS S3 (for storing resulting pdfs)

## Installation
* Install [OCRmyPDF](https://github.com/jbarlow83/OCRmyPDF)
* Clone this repository and do `npm install` to install required packages
* Export the following environment variables:
```[bash]
ACCESS_KEY          # AWS S3 access key
SECRET_KEY          # AWS S3 secret key
SENDGRID_USER       # Sendgrid api id
SENDGRID_PASS       # Sendgrid api key
PORT                # Port to run webserver on
```

## Usage
* `npm start` to run the webserver.

## Docker usage
```
docker run -d -e "PORT=<port>" -e "ACCESS_KEY=<access_key>" \
              -e "SECRET_KEY=<secret_key>" -e "SENDGRID_USER=<user>" \
              -e "SENDGRID_PASS=<key>" -e "CONFIG=<user db>" ozym4nd145/ocr_web
```
OR
```
docker run -d --env-file -p 3000:3000 <env.list file> ozym4nd145/ocr_web
```
