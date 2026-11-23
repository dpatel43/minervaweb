pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = 'dharmesh12/minervaweb'
        // ID of the Docker Hub credentials in Jenkins
        DOCKER_CRED_ID = 'Jenkins_Dockerhub'
        // Keep npm's cache in the workspace: the CI container's user has no writable home
        npm_config_cache = "${WORKSPACE}/.npm"
    }

    stages {
        stage('build') {
            steps {
                script {
                    // Node + Chromium image from ci/Dockerfile (Jenkins itself has neither)
                    ciImage = docker.build('minervaweb-ci', 'ci')
                    ciImage.inside {
                        sh 'npm ci'
                        sh 'npm run build'
                    }
                }
            }
        }
        stage('test') {
            steps {
                script {
                    ciImage.inside {
                        sh 'npx ng test --watch=false --browsers=ChromeHeadlessCI'
                    }
                }
            }
        }
        stage('buildDockerImage') {
            steps {
                script {
                    // Build the image and tag it with the Jenkins build number and 'latest'
                    // The 'docker.build' syntax requires the Docker Pipeline plugin
                    dockerImage = docker.build("${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER}")
                    dockerImage.tag("latest")
                }
            }
        }
        stage('pushDockerImage') {
            steps {
                script {
                    // Securely use credentials for logging in and pushing the image
                    docker.withRegistry('https://registry.hub.docker.com', DOCKER_CRED_ID) {
                        dockerImage.push()
                        dockerImage.push("latest")
                    }
                }
            }
        }
        stage('deploy') {
            steps {
                // Redeploys the cluster with the :latest just pushed (deploy-minervafinanceapps' Jenkinsfile)
                build job: '/minervafinance-deployment', wait: false
            }
        }
    }
}
