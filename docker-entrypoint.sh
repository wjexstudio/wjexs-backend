#!/bin/bash
set -e

# ตรวจสอบและสร้างโฟลเดอร์ใน Persistent Volume
if [ ! -d "/data/knowledge-base" ]; then
  echo "Initializing knowledge-base in /data..."
  mkdir -p /data/knowledge-base
  
  if [ ! -z "$GITHUB_TOKEN" ]; then
    echo "Cloning knowledge-base from GitHub..."
    git clone https://${GITHUB_TOKEN}@github.com/wjexstudio/knowledge-base.git /data/knowledge-base-temp
    cp -r /data/knowledge-base-temp/* /data/knowledge-base/
    rm -rf /data/knowledge-base-temp
  else
    echo "No GITHUB_TOKEN provided. Creating empty 12 Realms structure..."
    mkdir -p "/data/knowledge-base/INBOX"
    mkdir -p "/data/knowledge-base/wiki"
    mkdir -p "/data/knowledge-base/PROJECTS"
    mkdir -p "/data/knowledge-base/LEWIS DIARY"
    echo "# WJEXSTUDIO-OS Root Index" > "/data/knowledge-base/INDEX.md"
  fi
fi

echo "Starting application..."
exec "$@"
