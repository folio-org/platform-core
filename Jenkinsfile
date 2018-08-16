@Library ('folio_jenkins_shared_libs@FOLIO-1344') _

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

    stage('Build Stripes Platform') {
      steps {
        buildStripesPlatform('http://folio-snapshot-stable.aws.indexdata.com','diku')
      }
    }

  } // end stages

  post {
    always {
      sendNotifications currentBuild.result
    }
  }

}


