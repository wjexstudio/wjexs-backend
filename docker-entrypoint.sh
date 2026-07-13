#!/bin/bash
set -e

# ตรวจสอบและสร้างโฟลเดอร์ใน Persistent Volume
if [ ! -d "/data/knowledge-base" ]; then
  echo "Initializing knowledge-base in /data..."
  mkdir -p /data/knowledge-base
  
  if [ ! -z "$GITHUB_TOKEN" ]; then
    echo "Cloning knowledge-base from GitHub..."
    git clone --depth 1 https://${GITHUB_TOKEN}@github.com/wjexstudio/knowledge-base.git /tmp/knowledge-base-temp
    rm -rf /tmp/knowledge-base-temp/ARCHIVE
    cp -r /tmp/knowledge-base-temp/* /data/knowledge-base/
    rm -rf /tmp/knowledge-base-temp
    
    echo "Cloning wjexstudio-os from GitHub..."
    mkdir -p /data/wjexstudio-os
    git clone --depth 1 https://${GITHUB_TOKEN}@github.com/wjexstudio/wjexstudio-os.git /tmp/os-temp
    cp -r /tmp/os-temp/* /data/wjexstudio-os/
    cp /tmp/os-temp/.* /data/wjexstudio-os/ 2>/dev/null || true
    rm -rf /tmp/os-temp
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
