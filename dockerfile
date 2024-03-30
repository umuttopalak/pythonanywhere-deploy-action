# Base image
FROM python:3.10

# Set working directory
WORKDIR /app

# Copy requirements.txt to the working directory
COPY requirements.txt .

# Install dependencies
RUN pip3 install -r requirements.txt

# Copy the source code to the working directory
COPY src/ .

# Run the update scripts
RUN python3 main.py
