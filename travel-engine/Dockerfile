steps:
  - name: 'gcr.io/cloud-builders/docker'
    dir: 'travel-engine'              # ← run from inside travel-engine/
    args:
      - build
      - -t
      - europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/promptwars-pranav:$COMMIT_SHA
      - .                             # ← context is current dir (travel-engine/)

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
