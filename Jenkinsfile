@Library ('folio_jenkins_shared_libs@FOLIO-1738') _

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
    folioRegistry = 'http://folio-registry.aws.indexdata.com'
    npmConfig = 'jenkins-npm-folio'
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
        sendNotifications 'STARTED'
        script {
          currentBuild.displayName = "#${env.BUILD_NUMBER}-${env.JOB_BASE_NAME}"
          def foliociLib = new org.folio.foliociCommands()
          def tenant
          if (env.CHANGE_ID) { 
            tenant = "pr_${env.CHANGE_ID}_${env.BUILD_NUMBER}"
          }
          else {
            tenant = 'diku'
          }
          env.tenant = foliociLib.replaceHyphen(tenant)
        }
      }
    }

    stage('Build Stripes Platform') {
      steps {
        echo "Okapi URL: ${params.OKAPI_URL}"
        echo "Tenant: ${env.tenant}"

        buildStripesPlatform(params.OKAPI_URL,env.tenant)
      }
    }

    stage('Check Platform Dependencies') {
      steps {
        script {
          def stripesInstallJson = readFile('./stripes-install.json')
          platformDepCheck(env.tenant,stripesInstallJson)
        }
      }
    }

/*
 *   stage('Bootstrap Tenant') {
 *     when {
 *       changeRequest()
 *     }
 *     steps {
 *       deployTenant(params.OKAPI_URL,env.tenant)
 *     }
 *   }
 *
 *   stage('Run Integration Tests') {
 *     when {
 *       changeRequest()
 *     }
 *     steps {
 *       script {
 *         def testOpts = [ tenant: env.tenant,
 *                          folioUser: env.tenant + '_admin',
 *                          folioPassword: 'admin']
 *
 *         runIntegrationTests(testOpts,params.DEBUG_TEST)
 *       }
 *     }
 *   }
 */

/*
 *   stage('Publish NPM Package') {
 *     when {
 *       buildingTag()
 *     }
 *     steps {
 *       // clean up any artifacts
 *       sh 'rm -rf output artifacts ci node_modules'
 *
 *       withCredentials([string(credentialsId: 'jenkins-npm-folioci',variable: 'NPM_TOKEN')]) {
 *          withNPM(npmrcConfig: env.npmConfig) {
 *            // clean up generated artifacts before publishing
 *            sh 'rm -rf ci output'
 *            sh 'npm publish'
 *          }
 *       }
 *     }
 *   }
 */

  } // end stages

  post {
    always {
      sendNotifications currentBuild.result
    }
  }
}

