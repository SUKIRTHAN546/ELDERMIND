from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
# ⬆️ First run downloads ~90MB — normal, just wait

vec = model.encode('I have a son named Karthik in Bangalore')
vec2 = model.encode("I have a son named Karthi in Bangalore")
print(f'Vector shape: {vec.shape}')   # Should print: (384,)
print(f'First 10 values: {vec[:10]}')   # Should print 5 floats
print(f'First 10 values: {vec2[:10]}')
