#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

# 讀取檔案
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到 js-yaml 那一行並在後面插入新行
output_lines = []
for line in lines:
    output_lines.append(line)
    if 'js-yaml' in line and '</script>' in line:
        output_lines.append('  <script src="performance-mode.js" defer></script>\n')

# 寫回檔案
with open('index.html', 'w', encoding='utf-8', newline='\r\n') as f:
    for line in output_lines:
        f.write(line.rstrip('\r\n') + '\r\n')

print("Successfully added performance-mode.js script reference!")
