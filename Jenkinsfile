@Library ('folio_jenkins_shared_libs') _

pipeline {

  agent {
    node {
      label 'jenkins-slave-all'
    }
  }

  stages {
    stage('Prep') {
      steps {
        script {
          currentBuild.displayName = "#${env.BUILD_NUMBER}-${env.JOB_BASE_NAME}"
        }
        sendNotifications 'STARTED'
      }
    }

    stage('Build platform-core') {
      steps {
        sh 'yarn install && yarn build output'
      }
    }

  } // end stages

  post {
    always {
      sendNotifications currentBuild.result
    }
  }

}


