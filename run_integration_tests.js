import dotenv from "dotenv";

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;
const uniqueEmail = `tester_${Date.now()}@example.com`;
const password = "StrongP@ss123!";
let accessToken = "";
let formId = "";

const runTests = async () => {
  console.log("==========================================");
  console.log("🟢 STARTING HIGH-FIDELITY API INTEGRATION TESTS");
  console.log(`📡 Targeting Server: ${BASE_URL}`);
  console.log("==========================================\n");

  try {
    // ----------------------------------------------------
    // Test 1: User Registration
    // ----------------------------------------------------
    console.log("🔄 Test 1: User Registration (/api/auth/register)...");
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Faiz Ahmed",
        email: uniqueEmail,
        password: password
      })
    });
    const regData = await regRes.json();
    if (!regRes.ok) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }
    console.log("✅ Registration Successful!");
    console.log(`👤 Name: ${regData.user.name}`);
    console.log(`📧 Email: ${regData.user.email}`);
    accessToken = regData.accessToken;

    // ----------------------------------------------------
    // Test 2: User Login
    // ----------------------------------------------------
    console.log("\n🔄 Test 2: User Login (/api/auth/login)...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: password
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    console.log("✅ Login Successful!");
    accessToken = loginData.accessToken;

    // ----------------------------------------------------
    // Test 3: Create Form Draft
    // ----------------------------------------------------
    console.log("\n🔄 Test 3: Create Form Draft (/api/forms)...");
    const createRes = await fetch(`${BASE_URL}/api/forms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      throw new Error(`Form creation failed: ${JSON.stringify(createData)}`);
    }
    console.log("✅ Form Creation Successful!");
    console.log(`📝 Form ID: ${createData.form._id}`);
    formId = createData.form._id;

    // ----------------------------------------------------
    // Test 4: Get All Owned Forms
    // ----------------------------------------------------
    console.log("\n🔄 Test 4: Get All Owned Forms (/api/forms)...");
    const formsRes = await fetch(`${BASE_URL}/api/forms`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });
    const formsData = await formsRes.json();
    if (!formsRes.ok) {
      throw new Error(`Get forms failed: ${JSON.stringify(formsData)}`);
    }
    console.log(`✅ Get Forms Successful! Forms Count: ${formsData.count}`);

    // ----------------------------------------------------
    // Test 5: Update Form Structure & Options
    // ----------------------------------------------------
    console.log("\n🔄 Test 5: Update Form Structure & Options (/api/forms/:id)...");
    const updateRes = await fetch(`${BASE_URL}/api/forms/${formId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        title: "Client Feedback Survey",
        description: "Your opinion matters to us!",
        published: true,
        fields: [
          {
            id: "q1",
            type: "short_answer",
            label: "What is your full name?",
            required: true,
            options: []
          },
          {
            id: "q2",
            type: "multiple_choice",
            label: "How would you rate our service?",
            required: true,
            options: ["Excellent", "Good", "Average", "Poor"]
          }
        ]
      })
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      throw new Error(`Form update failed: ${JSON.stringify(updateData)}`);
    }
    console.log("✅ Form Structure Update & Options Saved Successfully!");

    // ----------------------------------------------------
    // Test 6: Get Single Form (Respondent / Public View)
    // ----------------------------------------------------
    console.log("\n🔄 Test 6: Get Single Form (Respondent View) (/api/forms/:id)...");
    const singleRes = await fetch(`${BASE_URL}/api/forms/${formId}`);
    const singleData = await singleRes.json();
    if (!singleRes.ok) {
      throw new Error(`Get single form failed: ${JSON.stringify(singleData)}`);
    }
    console.log(`✅ Get Form Details Successful! Views count: ${singleData.form.views}`);

    // ----------------------------------------------------
    // Test 7: Submit Response Answers
    // ----------------------------------------------------
    console.log("\n🔄 Test 7: Submit Response Answers (/api/responses/:formId)...");
    const submitRes = await fetch(`${BASE_URL}/api/responses/${formId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: [
          { fieldId: "q1", value: "Tester Faiz" },
          { fieldId: "q2", value: "Excellent" }
        ],
        submissionDuration: 30
      })
    });
    const submitData = await submitRes.json();
    if (!submitRes.ok) {
      throw new Error(`Response submission failed: ${JSON.stringify(submitData)}`);
    }
    console.log("✅ Respondent Answer Submission Successful!");

    // ----------------------------------------------------
    // Test 8: Get Form Responses (Creator Protected View)
    // ----------------------------------------------------
    console.log("\n🔄 Test 8: Get Form Responses (Creator View) (/api/responses/:formId)...");
    const responsesRes = await fetch(`${BASE_URL}/api/responses/${formId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });
    const responsesData = await responsesRes.json();
    if (!responsesRes.ok) {
      throw new Error(`Get responses failed: ${JSON.stringify(responsesData)}`);
    }
    console.log(`✅ Fetch Form Responses Successful! Count: ${responsesData.responses.length}`);

    // ----------------------------------------------------
    // Test 9: Export Responses CSV (Creator Protected View)
    // ----------------------------------------------------
    console.log("\n🔄 Test 9: Export Responses CSV (/api/responses/:formId/export)...");
    const exportRes = await fetch(`${BASE_URL}/api/responses/${formId}/export`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });
    const exportData = await exportRes.text();
    if (!exportRes.ok) {
      throw new Error(`Export responses failed: ${exportData}`);
    }
    console.log("✅ Export Responses to CSV Successful!");
    console.log("📊 Sample CSV Header:\n" + exportData.split("\n")[0]);

    // ----------------------------------------------------
    // Test 10: Get Form Analytics Dashboards
    // ----------------------------------------------------
    console.log("\n🔄 Test 10: Get Form Analytics Dashboards (/api/analytics/:formId)...");
    const analyticsRes = await fetch(`${BASE_URL}/api/analytics/${formId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });
    const analyticsData = await analyticsRes.json();
    if (!analyticsRes.ok) {
      throw new Error(`Get analytics failed: ${JSON.stringify(analyticsData)}`);
    }
    console.log("✅ Retrieve Analytics Successful!");
    console.log(`📈 Completion Rate: ${analyticsData.analytics.summary.completionRate}%`);
    console.log(`👁️ Total Views: ${analyticsData.analytics.summary.totalViews}`);
    console.log(`📥 Total Submissions: ${analyticsData.analytics.summary.totalSubmissions}`);

    // ----------------------------------------------------
    // Test 11: Cascade Delete Form & Clean Up
    // ----------------------------------------------------
    console.log("\n🔄 Test 11: Cascade Delete Form & Clean Up (/api/forms/:id)...");
    const deleteRes = await fetch(`${BASE_URL}/api/forms/${formId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });
    const deleteData = await deleteRes.json();
    if (!deleteRes.ok) {
      throw new Error(`Form deletion failed: ${JSON.stringify(deleteData)}`);
    }
    console.log(`✅ Cascade Delete Form Successful! Count of deleted response documents: ${deleteData.deletedResponsesCount}`);

    console.log("\n==========================================");
    console.log("🎉 ALL 11 API INTEGRATION TESTS PASSED FLAWLESSLY!");
    console.log("==========================================");
  } catch (error) {
    console.error("\n❌ INTEGRATION TEST FAILED!");
    console.error(error.message);
    process.exit(1);
  }
};

runTests();
