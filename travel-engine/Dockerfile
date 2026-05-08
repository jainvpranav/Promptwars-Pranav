steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - -t
      - europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/promptwars-pranav:$COMMIT_SHA
      - -f
      - ./travel-engine/Dockerfile    # ← explicit path to Dockerfile
      - ./travel-engine               # ← build context

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - push
      - europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/promptwars-pranav:$COMMIT_SHA

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - run
      - deploy
      - promptwars-pranav
      - --image=europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/promptwars-pranav:$COMMIT_SHA
      - --region=europe-west1
      - --platform=managed
      - --allow-unauthenticated
      - --port=3000

images:
  - europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/promptwars-pranav:$COMMIT_SHA
