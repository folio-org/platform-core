@Library ('folio_jenkins_shared_libs@FOLIO-1738') _

pipeline {

  environment {
    folioPlatform = 'platform-core'
    folioHostname = "${folioPlatform}-${env.CHANGE_ID}-${env.BUILD_NUMBER}"
    ec2Group = "platform_core_${env.CHANGE_ID}_${env.BUILD_NUMBER}"
    npmConfig = 'jenkins-npm-folio'
    sshKeyId = '11657186-f4d4-4099-ab72-2a32e023cced'
    folioRegistry = 'http://folio-registry.aws.indexdata.com'
    releaseOnly = 'true'
    okapiUrl = "http://${env.folioHostname}:9130"
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
        echo "Okapi URL: ${env.okapiUrl}"
        echo "Tenant: ${env.tenant}"

        buildStripesPlatform(env.okapiUrl,env.tenant)
      }
    }

    stage('Check Platform Dependencies') {
      steps {
        script {
          def stripesInstallJson = readFile('./stripes-install.json')
          platformDepCheck(env.tenant,stripesInstallJson)
          echo 'Generating backend dependency list to okapi-install.json'
          sh 'jq \'map(select(.id | test(\"mod-\"; \"i\")))\' install.json > okapi-install.json'
          sh 'cat okapi-install.json'
        }
        // archive install.json
        sh 'mkdir -p ci'
        sh 'cp install.json ci'
        publishHTML([allowMissing: false, alwaysLinkToLastBuild: false,
                     keepAll: true, reportDir: 'ci',
                     reportFiles: 'install.json',
                     reportName: "install.json",
                     reportTitles: "install.json"])
      }
      
    }

    stage('Build FOLIO Instance') {

      when {
        changeRequest()
      }
      steps {
        // build FOLIO instance
        buildPlatformInstance(env.ec2Group,env.folioHostname,env.tenant)
      }
   }

   stage('Run Integration Tests') {
     when {
       changeRequest()
     }
     steps {
       script {
         def testOpts = [ tenant: env.tenant,
                          folioUser: env.tenant + '_admin',
                          folioPassword: 'admin']

         runIntegrationTests(testOpts,params.DEBUG_TEST)
       }
     }
   }

   stage('Publish NPM Package') {
     when {
       buildingTag()
     }
     steps {
       withCredentials([string(credentialsId: 'jenkins-npm-folioci',variable: 'NPM_TOKEN')]) {
          withNPM(npmrcConfig: env.npmConfig) {
            // clean up generated artifacts before publishing
            sh 'rm -rf ci artifacts bundle node_modules'
            sh 'npm publish'
          }
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

