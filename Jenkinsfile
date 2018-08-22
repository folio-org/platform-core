@Library ('folio_jenkins_shared_libs@FOLIO-1344') _

pipeline {

  environment {   
    okapiUrl = 'http://folio-snapshot-stable.aws.indexdata.com:9130'
    tenant = "platform_core_${env.BUILD_NUMBER}"
  }

  options { 
    timeout(30)
  }

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
        buildStripesPlatform(env.okapiUrl,env.tenant)
        script {
          def tenantStatus = deployTenant(env.okapiUrl,env.tenant)
          echo "Okapi URL: ${env.okapiUrl}"
          echo "Tenant: ${env.tenant}"
          echo "Tenant Bootstrap Status: $tenantStatus"
        }
      }
    }

  } // end stages

  post {
    always {
      sendNotifications currentBuild.result
    }
  }

}


