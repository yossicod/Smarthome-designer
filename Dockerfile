# Build stage
FROM node:20-slim AS build
WORKDIR /app
RUN npm config set strict-ssl false
COPY package*.json ./
# הוספנו את install כדי שכל כלי הבנייה יהיו זמינים
RUN npm install
COPY . .
# כאן קורה הקסם - בניית האפליקציה
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]