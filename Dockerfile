# ---------- Tahap 1: build aplikasi React ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install dependency lebih dulu agar layer ini ter-cache
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

# Vite membaca variabel VITE_* saat build, jadi nilainya ditanam ke bundle
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---------- Tahap 2: sajikan hasil build dengan Nginx ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
