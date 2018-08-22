@Library ('folio_jenkins_shared_libs@FOLIO-1344') _

pipeline {

  parameters { 
    booleanParam(name: 'DEBUG_TEST', 
                 defaultValue: false, 
                 description: 'Enable integration test debugging')
    string(name: 'OKAPI_URL', 
           defaultValue: 'http://folio-snapshot-stable.aws.indexdata.com:9130', 
           description: 'Okapi URL')
  }

  environment {   
    tenant = "platform_core_${env.BUILD_NUMBER}"
  }

  options { 
    timeout(30)
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  agent {
    node {
      label 'jenkins-slave-all'
    }
  }

  stages {
    stage('Setup') {
      steps {
        script {
          currentBuild.displayName = "#${env.BUILD_NUMBER}-${env.JOB_BASE_NAME}"
        }
        sendNotifications 'STARTED'
      }
    }

    stage('Build Stripes Platform') {
      steps {
        echo "Okapi URL: ${params.OKAPI_URL}"
        echo "Tenant: ${env.tenant}"

        buildStripesPlatform(params.OKAPI_URL,env.tenant)
      }
    }
    
    stage('Bootstrap Tenant') {
      steps { 
        deployTenant(params.OKAPI_URL,env.tenant)
      }
    }

    stage('Run Integration Tests') {
      steps {
        runIntegrationTests(params.DEBUG_TEST,params.OKAPI_URL,env.tenant,"${env.tenant}_admin",'admin')
      }
    }
  } // end stages

  post {
    always {
      sendNotifications currentBuild.result
    }
  }
}

