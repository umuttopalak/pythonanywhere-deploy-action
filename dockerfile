# Base image
FROM python:3.10

# Set working directory
WORKDIR /app

# Copy requirements.txt to the working directory
COPY requirements.txt .

# Install dependencies
RUN pip install -r requirements.txt

# Copy the source code to the working directory
COPY src/ .

# Run the update scripts
RUN python update_repository.py
RUN python update_requirements.py
RUN python reload_host.py
