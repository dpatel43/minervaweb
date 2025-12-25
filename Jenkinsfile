pipeline {
    agent any

    environment {
        // Replace 'your_dockerhub_username/your_repo_name' with your details
        DOCKER_IMAGE_NAME = 'dharmesh12/minervaweb'
        // Reference the ID of the credentials you created in Jenkins
        DOCKER_CRED_ID = 'jenkins_dockerhub'
    }

    stages {
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
    }
}
