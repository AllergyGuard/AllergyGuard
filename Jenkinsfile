
pipeline {
    agent any

    environment {
        IMAGE_NAME = 'srividya14/allergyguard-backend'
        CONTAINER_NAME = 'allergyguard-backend-ci'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Source code checked out successfully.'
            }
        }

        stage('Build') {
            steps {
                dir('legacy/backend') {
                    bat 'npm install'
                }
            }
        }

        stage('Test/Validate') {
            steps {
                dir('legacy/backend') {
                    bat 'npm test -- --passWithNoTests'
                }
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t %IMAGE_NAME%:%BUILD_NUMBER% -t %IMAGE_NAME%:latest legacy/backend'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_TOKEN'
                )]) {
                    bat 'docker login -u %DOCKER_USER% --password-stdin < nul'
                    bat 'echo %DOCKER_TOKEN% | docker login -u %DOCKER_USER% --password-stdin'
                    bat 'docker push %IMAGE_NAME%:%BUILD_NUMBER%'
                    bat 'docker push %IMAGE_NAME%:latest'
                }
            }
        }

        stage('Deploy') {
            steps {
                bat 'docker rm -f %CONTAINER_NAME% 2>nul || exit /b 0'
                bat 'docker run -d --name %CONTAINER_NAME% -p 4000:4000 %IMAGE_NAME%:%BUILD_NUMBER%'
            }
        }

        stage('Verify Deployment') {
            steps {
                bat 'powershell -NoProfile -Command "$ok=$false; for($i=0;$i -lt 12;$i++){ try { $r=Invoke-WebRequest -Uri http://localhost:4000/health -UseBasicParsing -TimeoutSec 3; if($r.StatusCode -eq 200){$ok=$true; break} } catch {}; Start-Sleep -Seconds 5 }; if(-not $ok){throw ''Health check failed''}"'
                bat 'docker ps'
            }
        }
    }
}
