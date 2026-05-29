FROM nginx:alpine

# Copy the HTML file
COPY index.html /usr/share/nginx/html/index.html

# Copy nginx config that injects the backend URL
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
