// tests/performance/create-jmeter-test.js
// This creates a JMeter test plan programmatically

const fs = require('fs');

const jmeterTestPlan = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.5">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Trading Platform Load Test" enabled="true">
      <stringProp name="TestPlan.comments">Load test for trading platform API</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments">
        <collectionProp name="Arguments.arguments">
          <elementProp name="BASE_URL" elementType="Argument">
            <stringProp name="Argument.name">BASE_URL</stringProp>
            <stringProp name="Argument.value">localhost</stringProp>
          </elementProp>
          <elementProp name="PORT" elementType="Argument">
            <stringProp name="Argument.name">PORT</stringProp>
            <stringProp name="Argument.value">3000</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>
    <hashTree>
      <!-- Thread Group for User Registration/Login -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="User Authentication" enabled="true">
        <stringProp name="ThreadGroup.num_threads">100</stringProp>
        <stringProp name="ThreadGroup.ramp_time">60</stringProp>
        <intProp name="ThreadGroup.loops">1</intProp>
      </ThreadGroup>
      <hashTree>
        <!-- HTTP Request for Registration -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Register User" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">{
  "email": "user\${__threadNum}@example.com",
  "password": "password123",
  "fullName": "Load Test User \${__threadNum}"
}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.domain">\${BASE_URL}</stringProp>
          <stringProp name="HTTPSampler.port">\${PORT}</stringProp>
          <stringProp name="HTTPSampler.path">/api/auth/register</stringProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <stringProp name="HTTPSampler.contentEncoding">UTF-8</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp>
        </HTTPSamplerProxy>
        <hashTree>
          <!-- Extract token from response -->
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Extract Token" enabled="true">
            <stringProp name="JSONPostProcessor.referenceNames">authToken</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">$.token</stringProp>
          </JSONPostProcessor>
        </hashTree>
      </hashTree>
      
      <!-- Thread Group for Trading Operations -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Trading Operations" enabled="true">
        <stringProp name="ThreadGroup.num_threads">50</stringProp>
        <stringProp name="ThreadGroup.ramp_time">30</stringProp>
        <intProp name="ThreadGroup.loops">10</intProp>
      </ThreadGroup>
      <hashTree>
        <!-- Get Market Prices -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Get Market Prices" enabled="true">
          <stringProp name="HTTPSampler.domain">\${BASE_URL}</stringProp>
          <stringProp name="HTTPSampler.port">\${PORT}</stringProp>
          <stringProp name="HTTPSampler.path">/api/market/prices</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
        </HTTPSamplerProxy>
        
        <!-- Place Order -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Place Order" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <stringProp name="Argument.value">{
  "symbol": "\${__RandomFromCSV(AAPL,GOOGL,MSFT,AMZN,TSLA)}",
  "orderType": "\${__RandomFromCSV(BUY,SELL)}",
  "quantity": "\${__Random(1,10)}",
  "price": "\${__Random(100,300)}"
}</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.domain">\${BASE_URL}</stringProp>
          <stringProp name="HTTPSampler.port">\${PORT}</stringProp>
          <stringProp name="HTTPSampler.path">/api/orders/place</stringProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <elementProp name="HTTPSampler.header_manager" elementType="HeaderManager">
            <collectionProp name="HeaderManager.headers">
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Authorization</stringProp>
                <stringProp name="Header.value">Bearer \${authToken}</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
        </HTTPSamplerProxy>
      </hashTree>
      
      <!-- Listeners -->
      <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="View Results Tree" enabled="true"/>
      <ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Summary Report" enabled="true"/>
      <ResultCollector guiclass="GraphVisualizer" testclass="ResultCollector" testname="Graph Results" enabled="true"/>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;

// Save the test plan
fs.writeFileSync('tests/performance/trading-platform-load-test.jmx', jmeterTestPlan);
console.log('JMeter test plan created successfully!');