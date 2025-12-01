#!/usr/bin/env pwsh
# Run UI tests inside Docker container and extract video output

$ErrorActionPreference = "Stop"

# Check if we should rebuild or reuse existing image
$rebuild = $args[0] -eq "--rebuild"
$imageExists = (docker images -q mqtt-explorer-tests 2>$null) -ne $null -and (docker images -q mqtt-explorer-tests 2>$null) -ne ""

if ($rebuild -or -not $imageExists) {
  Write-Host "Building Docker image with project files..." -ForegroundColor Cyan

  # Create a temporary Dockerfile that includes the project
  $tempDockerfile = @"
FROM node:20

RUN DEBIAN_FRONTEND="noninteractive" apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates nano ffmpeg xvfb git-core tmux locales mosquitto x11vnc
RUN apt-get install -yq --no-install-recommends libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 libnss3

# Generate locales for TMUX
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

WORKDIR /app
COPY . /app

# Fix line endings for shell scripts (Windows CRLF -> Unix LF)
RUN apt-get install -y dos2unix && \
    find /app/scripts -name "*.sh" -exec dos2unix {} \; && \
    chmod +x /app/scripts/*.sh

RUN yarn install
RUN yarn build

CMD ["/bin/bash"]
"@

  $tempDockerfile | Out-File -FilePath "Dockerfile.uitests" -Encoding UTF8

  docker build -f Dockerfile.uitests -t mqtt-explorer-tests .
  Remove-Item "Dockerfile.uitests" -ErrorAction SilentlyContinue
} else {
  Write-Host "Reusing existing Docker image and updating test files..." -ForegroundColor Cyan
  
  # Start a temporary container to update test files
  $tempContainer = docker run -d mqtt-explorer-tests tail -f /dev/null
  
  # Copy updated test files
  docker cp ./src/spec "${tempContainer}:/app/src/"
  
  # Rebuild tests inside container
  docker exec $tempContainer /bin/bash -c "yarn build"
  
  # Commit the updated container as new image
  docker commit $tempContainer mqtt-explorer-tests | Out-Null
  docker rm -f $tempContainer | Out-Null
  
  Write-Host "Test files updated in container" -ForegroundColor Green
}

Write-Host "`nRunning UI tests in Docker..." -ForegroundColor Cyan

# Run tests and keep container to extract files
$containerId = docker run -d mqtt-explorer-tests /bin/bash -c "./scripts/uiTests.sh; sleep 10"

# Wait for tests to complete and show logs
docker logs -f $containerId

# Get exit code
$exitCode = [int](docker wait $containerId)

# Check what files were created
Write-Host "`nListing files in container /app directory..." -ForegroundColor Cyan
docker exec $containerId ls -la /app/*.mp4 2>$null
docker exec $containerId ls -la /app/*.gif 2>$null
docker exec $containerId ls -la /app/*.yuv 2>$null

# Copy video files from container
Write-Host "`nExtracting video files from container..." -ForegroundColor Cyan

docker cp "${containerId}:/app/ui-test.mp4" ./ui-test.mp4 2>$null
docker cp "${containerId}:/app/ui-test.gif" ./ui-test.gif 2>$null
docker cp "${containerId}:/app/qrawvideorgb24.yuv" ./qrawvideorgb24.yuv 2>$null

# Remove container
docker rm $containerId | Out-Null

if ($exitCode -eq 0) {
  Write-Host "`nUI tests completed successfully!" -ForegroundColor Green
  
  if (Test-Path "./ui-test.mp4") {
    Write-Host "Video file extracted: ui-test.mp4" -ForegroundColor Green
  } elseif (Test-Path "./qrawvideorgb24.yuv") {
    Write-Host "Raw video file found, converting to MP4..." -ForegroundColor Yellow
    docker run --rm `
      -v "${PWD}:/output" `
      -w /output `
      mqtt-explorer-tests `
      /bin/bash -c "ffmpeg -f rawvideo -pix_fmt yuv420p -s 1024x720 -r 20 -i qrawvideorgb24.yuv -c:v libx264 -preset fast -crf 22 ui-test.mp4"
    Write-Host "Video converted: ui-test.mp4" -ForegroundColor Green
  } else {
    Write-Host "Warning: No video file found in container" -ForegroundColor Yellow
  }
  
  if (Test-Path "./ui-test.gif") {
    Write-Host "GIF file extracted: ui-test.gif" -ForegroundColor Green
  }
} else {
  Write-Host "`nUI tests failed with exit code $exitCode" -ForegroundColor Red
}

exit $exitCode
