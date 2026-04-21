import os
from itertools import cycle
from dotenv import load_dotenv

load_dotenv()

# Danh sách các key Ngân đã thêm vào .env
keys = [os.getenv("GEMINI_KEY_1"), os.getenv("GEMINI_KEY_2")]
key_pool = cycle(keys)

def get_gemini_key():
    """Trả về key tiếp theo trong danh sách"""
    return next(key_pool)