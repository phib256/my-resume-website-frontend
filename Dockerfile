# Use lightweight Nginx alpine image
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy our custom Nginx configuration (which handles the /api proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static HTML/CSS/JS assets to the web root
COPY . /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
