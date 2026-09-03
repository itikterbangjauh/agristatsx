# EcoTourism Pulse

ini code.gs /**

 * ============================================================================

 * PROJEK : AgriStatX - TourismEcoAI Web App Dashboard

 * ACARA  : DOSM Datathon 2026 (Warga DOSM)

 * STATUS : MOD BACAAN SAHAJA (DATA KEKAL & SELAMAT)

 * FAIL   : Code.gs (Server-Side Logic & Dynamic Data Processor)

 * ============================================================================

 */




const SHEET_NAME = "TourismEcoAI_BPPAS";




// Konfigurasi Pemberat Indeks Komposit (Piawaian UN SEEA / SF-MST)

const TEPI_CONFIG = {

  weights: {

    tourism: 0.30,  // Kepadatan & Ketibaan Pelancong (DTS)

    water: 0.25,    // Penggunaan Air Bersih (Juta m³)

    wqi_marine: 0.20,// Indeks Kualiti Air Marin / Tekanan Air [0-100]

    climate: 0.15,  // Taburan Hujan Tahunan (mm)

    forest: 0.10    // Keluasan Hutan Simpan Kekal (k Hektar)

  }

};




/**

 * Titik masuk utama Web App (HTTP GET)

 */

function doGet() {

  const template = HtmlService.createTemplateFromFile('Index');

  return template.evaluate()

    .setTitle('AgriStatX | TourismEcoAI Dashboard (BPPAS DOSM)')

    .addMetaTag('viewport', 'width=device-width, initial-scale=1')

    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

}




/**

 * Fungsi include untuk memuatkan fail separa HTML (CSS & JS)

 */

function include(filename) {

  return HtmlService.createHtmlOutputFromFile(filename).getContent();

}




/**

 * Pemicu menu di dalam Google Sheets

 */

function onOpen() {

  SpreadsheetApp.getUi()

    .createMenu('🌿 AgriStatX TourismEcoAI')

    .addItem('⚡ 1. Kira Semula Indeks TEPI (Dari Data Sheet)', 'recalculateFromSheet')

    .addSeparator()

    .addItem('🌐 2. Papar Pautan Web App', 'displayWebAppUrl')

    .addToUi();

}




/**

 * Mengambil dan memproses data SEBENAR dari helaian TourismEcoAI_BPPAS (READ ONLY)

 */

function getDashboardData() {

  try {

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const sheet = ss.getSheetByName(SHEET_NAME);

    

    if (!sheet) {

      return {

        status: "error",

        message: `Helaian '${SHEET_NAME}' tidak dijumpai. Sila pastikan nama tab sheet adalah tepat.`

      };

    }




    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {

      return {

        status: "error",

        message: `Helaian '${SHEET_NAME}' tidak mempunyai baris data.`

      };

    }




    // Baca data sebenar yang anda masukkan dari Baris 2 hingga Baris Terakhir (Lajur A hingga F)

    const rawData = sheet.getRange(2, 1, lastRow - 1, 6).getValues();




    // Tapis baris yang kosong jika ada

    const validRows = rawData.filter(r => r[0] !== "" && r[0] !== null);




    // Ekstrak nilai berangka untuk Normalisasi Min-Max

    const touristsArr = validRows.map(r => Number(r[1]) || 0);

    const waterArr = validRows.map(r => Number(r[2]) || 0);

    const wqiArr = validRows.map(r => Number(r[3]) || 0);

    const rainArr = validRows.map(r => Number(r[4]) || 0);

    const forestArr = validRows.map(r => Number(r[5]) || 0);




    const minTour = Math.min(...touristsArr), maxTour = Math.max(...touristsArr);

    const minWater = Math.min(...waterArr), maxWater = Math.max(...waterArr);

    const minWqi = Math.min(...wqiArr), maxWqi = Math.max(...wqiArr);

    const minRain = Math.min(...rainArr), maxRain = Math.max(...rainArr);

    const minForest = Math.min(...forestArr), maxForest = Math.max(...forestArr);




    const w = TEPI_CONFIG.weights;




    const records = validRows.map((row, idx) => {

      const state = String(row[0]).trim();

      const tourists = Number(Number(row[1] || 0).toFixed(2));

      const water = Number(Number(row[2] || 0).toFixed(1)); // Juta m³

      const wqi = Number(Number(row[3] || 0).toFixed(1));    // Skor MWQI [0-100]

      const rain = Number(Number(row[4] || 0).toFixed(0));   // mm

      const forest = Number(Number(row[5] || 0).toFixed(1)); // k Hektar




      // Intensiti Air: m³ air per pelancong (Juta m³ air / Juta pelancong)

      const waterIntensity = tourists > 0 ? Number((water / tourists).toFixed(2)) : 0;




      // Normalisasi Min-Max (0 - 100)

      const normTour = normalize(tourists, minTour, maxTour);

      const normWater = normalize(water, minWater, maxWater);

      

      // Tekanan Marin: Semakin rendah MWQI, semakin tinggi tekanan alam sekitar (100 - MWQI)

      const marineStress = 100 - wqi;

      const normWqi = normalize(marineStress, 100 - maxWqi, 100 - minWqi);

      const normRain = normalize(rain, minRain, maxRain);

      const normForest = normalize(forest, minForest, maxForest);




      // Sub-Skor Berpemberat mengikut UN SEEA

      const subTour = normTour * w.tourism;

      const subWater = normWater * w.water;

      const subWqi = normWqi * w.wqi_marine;

      const subRain = normRain * w.climate;

      const subForest = normForest * w.forest;




      const tepiScore = Number((subTour + subWater + subWqi + subRain + subForest).toFixed(1));

      const riskInfo = getRiskInfo(tepiScore);




      return {

        id: idx + 1,

        state: state,

        tourists: tourists,

        water: water,

        wqi: wqi,

        rain: rain,

        forest: forest,

        waterIntensity: waterIntensity,

        subScores: {

          tourism: Number(subTour.toFixed(1)),

          water: Number(subWater.toFixed(1)),

          wqi: Number(subWqi.toFixed(1)),

          climate: Number(subRain.toFixed(1)),

          forest: Number(subForest.toFixed(1))

        },

        tepi: tepiScore,

        riskCategory: riskInfo.category,

        riskColor: riskInfo.color,

        recommendation: getPolicyRecommendation(riskInfo.category, state)

      };

    });




    // Susun mengikut skor TEPI tertinggi (Zon Paling Kritikal di bahagian atas)

    records.sort((a, b) => b.tepi - a.tepi);




    // Ringkasan KPI Kebangsaan

    const totalTourists = records.reduce((acc, r) => acc + r.tourists, 0);

    const totalWater = records.reduce((acc, r) => acc + r.water, 0);

    const avgTEPI = records.length > 0 ? (records.reduce((acc, r) => acc + r.tepi, 0) / records.length) : 0;

    const criticalZones = records.filter(r => r.tepi >= 70).length;




    return {

      status: "success",

      timestamp: Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "yyyy-MM-dd HH:mm:ss"),

      kpi: {

        totalTourists: Number(totalTourists.toFixed(1)),

        totalWater: Number(totalWater.toFixed(1)),

        avgTEPI: Number(avgTEPI.toFixed(1)),

        criticalZones: criticalZones,

        totalStates: records.length

      },

      records: records

    };




  } catch (err) {

    return {

      status: "error",

      message: err.toString()

    };

  }

}




/**

 * Mengira semula dari Sheet tanpa mengubah apa-apa data

 */

function recalculateFromSheet() {

  const result = getDashboardData();

  if (result.status === "success") {

    SpreadsheetApp.getUi().alert(

      `✅ Data Berjaya Dibaca!\n\n` +

      `• Jumlah Negeri: ${result.kpi.totalStates}\n` +

      `• Jumlah Pelancong: ${result.kpi.totalTourists} M\n` +

      `• Jumlah Air: ${result.kpi.totalWater.toLocaleString()} Juta m³\n` +

      `• Purata Skor TEPI: ${result.kpi.avgTEPI} / 100\n` +

      `• Negeri Berisiko Tinggi: ${result.kpi.criticalZones}`

    );

  } else {

    SpreadsheetApp.getUi().alert(`⚠️ Ralat: ${result.message}`);

  }

}




function displayWebAppUrl() {

  const url = ScriptApp.getService().getUrl();

  if (url) {

    SpreadsheetApp.getUi().alert(`🌐 Pautan Web App Dashboard Anda:\n\n${url}`);

  } else {

    SpreadsheetApp.getUi().alert(`Sila klik butang Deploy > New deployment di Apps Script untuk mengaktifkan URL Web App!`);

  }

}




// --- FUNGSI PEMBANTU (HELPERS) ---




function normalize(val, min, max) {

  if (max === min) return 50;

  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

}




function getRiskInfo(score) {

  if (score >= 75) return { category: "🔴 Sangat Kritikal", color: "#D32F2F" };

  if (score >= 60) return { category: "🟠 Tinggi", color: "#F57C00" };

  if (score >= 40) return { category: "🟡 Sederhana", color: "#FBC02D" };

  return { category: "🟢 Rendah (Mampan)", color: "#388E3C" };

}




function getPolicyRecommendation(category, state) {

  if (category.includes("Sangat Kritikal")) {

    return `Kuatkuasakan kawalan had muatan (carrying capacity), tingkatkan segera rizab air & alihkan aliran pelancong ke zon alternatif.`;

  }

  if (category.includes("Tinggi")) {

    return `Pantau kualiti air marin dan jadualkan agihan air loji terawat sebelum musim kemuncak pelancongan.`;

  }

  if (category.includes("Sederhana")) {

    return `Kapasiti ekologi stabil. Galakkan inisiatif eko-pelancongan dan pensijilan kelestarian premis perhotelan.`;

  }

  return `Zon lestari. Destinasi berdaya tampung tinggi untuk menyerap limpahan pelancong dari negeri berisiko.`;

} ini index.html <!DOCTYPE html>
<html lang="ms">
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgriStatX | TourismEcoAI Dashboard - BPPAS DOSM</title>
  
  <!-- Bootstrap 5 CSS & Font Awesome -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  
  
  

  



  
    


      


        


          
        


        


          AgriStatX TourismEcoAI
          

DOSM Datathon 2026 • Model Kepintaran Tekanan Alam Sekitar Pelancongan


        


      


      


        
           BPPAS & DTS DOSM
        
        
           Muat Semula
        
      


    



  

    
    


      


      

Memuatkan Perangkaan BPPAS & Mengira Indeks TEPI...


      

Menyelaraskan data pelancongan dengan kapasiti ekologi 13 negeri.


    



    
    



      
      


        
        
        


          


            


              


                Pelancong Domestik
                
              


              


                

0.0 M


                

 Survei DTS Rasmi


              


            


          


        



        
        


          


            


              


                Penggunaan Air
                
              


              


                

0.0 Juta m³


                

 Isipadu Tahunan


              


            


          


        



        
        


          


            


              


                Purata TEPI
                
              


              


                

0.0 / 100


                

 Indeks Komposit


              


            


          


        



        
        


          


            


              


                Negeri Berisiko
                
              


              


                

0 Negeri


                

 Had Kritikal (≥70)


              


            


          


        



      



      
      


        


          


            


              


                
                

Enjin Simulasi Polisi "What-If" Pelancongan


              


              

Uji impak peningkatan pelancong terhadap keperluan air (Juta m³) & indeks TEPI:


              


                
                +0% Pelancong
              


            


            


              


                


                  


                    Unjuran Pelancong
                    0.0 M
                  


                  


                    Unjuran Keperluan Air
                    0.0 Juta m³
                  


                


              


            


          


        


      



      
      


        
        
        


          


            


              


                 Kedudukan Skor TEPI 13 Negeri
              


              Skala 0 - 100
            


            


              


            


          


        



        
        


          


            


              


                 Intensiti Air vs Kualiti Air Marin (MWQI)
              


              Matriks Sensitiviti
            


            


              


            


          


        



      



      
      


        


          


            


               Penguraian 5 Komponen Pemacu Tekanan Alam Sekitar (Root Cause)
            


            Pelancongan (30%) • Penggunaan Air (25%) • Tekanan Marin (20%) • Hujan (15%) • Hutan Simpan (10%)
          


          100% Stacked Analysis
        


        


          


        


      



      
      


        


          


             Matriks Pemantauan 13 Negeri & Cadangan Polisi Intervensi AI
          


          Diselaraskan dengan RMK-13 & UN SEEA
        


        


          


            


              
                
                  Kedudukan / Negeri
                  Pelancong (Juta)
                  Penggunaan Air (Juta m³)
                  Intensiti Air (m³/pelancong)
                  Skor TEPI
                  Status Risiko
                  Cadangan Intervensi Polisi Pintar (AI)
                
              
              
                
              
            


          


        

    

 

  



  


    


      © 2026 AgriStatX • Dibangunkan khusus untuk Pertandingan DOSM Datathon 2026 • Sumber: Kompendium BPPAS & DTS DOSM.
    



  



ini css.html <style>
  :root {
    --dosm-green-primary: #1B5E20;
    --dosm-green-dark: #0B3D11;
    --dosm-green-light: #2E7D32;
    --dosm-gold: #FFB300;
    --bg-surface: #F8F9FA;
    --card-border-radius: 12px;
  }

  body {
    background-color: var(--bg-surface);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #2D3748;
    overflow-x: hidden;
  }

  /* Navbar */
  .bg-dosm {
    background: linear-gradient(135deg, var(--dosm-green-dark) 0%, var(--dosm-green-primary) 100%) !important;
  }

  .brand-icon {
    width: 38px;
    height: 38px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bg-gold {
    background-color: var(--dosm-gold) !important;
  }

  .fs-7 {
    font-size: 0.72rem;
  }

  /* KPI Cards */
  .kpi-card {
    border-radius: var(--card-border-radius);
    background: #FFFFFF;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    min-height: 110px;
  }

  .kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06) !important;
  }

  .kpi-title {
    font-size: 0.74rem;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .kpi-value {
    font-size: clamp(1.25rem, 1.8vw, 1.65rem) !important;
    white-space: nowrap;
    line-height: 1.2;
  }

  /* Simulator Banner */
  .simulator-banner {
    background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #004D40 100%);
    border-radius: var(--card-border-radius);
  }

  .bg-dark-translucent {
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .custom-slider {
    accent-color: var(--dosm-gold);
    height: 6px;
  }

  /* Charts */
  .chart-card {
    border-radius: var(--card-border-radius);
  }

  .chart-box {
    width: 100%;
    height: 340px;
    position: relative;
  }

  .chart-box-large {
    width: 100%;
    height: 420px;
    position: relative;
  }

  /* Table */
  .table-responsive {
    border-radius: 0 0 var(--card-border-radius) var(--card-border-radius);
  }

  .table thead th {
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #4A5568;
    background-color: #F8FAFC;
    white-space: nowrap;
  }

  .table tbody td {
    font-size: 0.88rem;
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }

  .badge-tepi {
    font-size: 0.85rem;
    padding: 0.45em 0.8em;
    border-radius: 6px;
    font-weight: 700;
  }

  @media (max-width: 768px) {
    .chart-box {
      height: 280px;
    }
    .chart-box-large {
      height: 350px;
    }
  }
</style>
ini javascript.html <script>

  // Pembolehubah Global

  let globalDashboardData = null;

  let isGoogleChartsLoaded = false;

  let currentSimulationGrowth = 0;




  // Inisialisasi Pemuatan Google Charts

  google.charts.load('current', {

    'packages': ['corechart', 'bar', 'table']

  });




  google.charts.setOnLoadCallback(() => {

    isGoogleChartsLoaded = true;

    fetchDashboardData();

  });




  // Redraw responsif apabila saiz skrin berubah

  let resizeTimeout;

  window.addEventListener('resize', () => {

    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {

      if (globalDashboardData && isGoogleChartsLoaded) {

        renderAllCharts(globalDashboardData, currentSimulationGrowth);

      }

    }, 150);

  });




  /**

   * Menarik data daripada Server Apps Script

   */

  function fetchDashboardData() {

    const spinner = document.getElementById('loading-spinner');

    const content = document.getElementById('dashboard-content');

    const refreshIcon = document.getElementById('refresh-icon');




    spinner.style.display = 'block';

    content.style.display = 'none';

    if (refreshIcon) refreshIcon.classList.add('fa-spin');




    google.script.run

      .withSuccessHandler(onDataSuccess)

      .withFailureHandler(onDataFailure)

      .getDashboardData();

  }




  function onDataSuccess(response) {

    const spinner = document.getElementById('loading-spinner');

    const content = document.getElementById('dashboard-content');

    const refreshIcon = document.getElementById('refresh-icon');




    spinner.style.display = 'none';

    if (refreshIcon) refreshIcon.classList.remove('fa-spin');




    if (response.status !== 'success') {

      alert('Ralat semasa membaca data: ' + response.message);

      return;

    }




    globalDashboardData = response;

    content.style.display = 'block';




    // Kemas kini Kad KPI

    updateKPICards(response.kpi);




    // Lukis Semua Carta

    renderAllCharts(response, currentSimulationGrowth);




    // Paparkan Jadual

    renderDestinationTable(response.records, currentSimulationGrowth);




    // Inisialisasi Paparan Simulasi

    updateSimulationOverview(response.kpi, currentSimulationGrowth);

  }




  function onDataFailure(error) {

    document.getElementById('loading-spinner').style.display = 'none';

    alert('Gagal menyambung ke Apps Script: ' + error.message);

  }




  function updateKPICards(kpi) {

    document.getElementById('kpi-tourists').innerText = kpi.totalTourists.toFixed(1) + ' M';

    document.getElementById('kpi-water').innerText = kpi.totalWater.toLocaleString() + ' Juta m³';

    document.getElementById('kpi-avg-tepi').innerText = kpi.avgTEPI.toFixed(1);

    document.getElementById('kpi-critical-zones').innerText = kpi.criticalZones + ' Negeri';

  }




  function renderAllCharts(data, growthRate) {

    if (!isGoogleChartsLoaded || !data) return;

    drawTEPIRankingChart(data.records, growthRate);

    drawUtilityBubbleChart(data.records);

    drawStackedDecompositionChart(data.records);

  }




  /**

   * Carta 1: Kedudukan Skor TEPI 13 Negeri

   */

  function drawTEPIRankingChart(records, growthRate) {

    const dataTable = new google.visualization.DataTable();

    dataTable.addColumn('string', 'Negeri');

    dataTable.addColumn('number', 'Skor TEPI');

    dataTable.addColumn({type: 'string', role: 'style'});

    dataTable.addColumn({type: 'string', role: 'tooltip'});




    records.forEach(r => {

      const simulatedTEPI = Math.min(100, r.tepi * (1 + (growthRate * 0.4)));

      let color = '#388E3C'; // Hijau

      if (simulatedTEPI >= 75) color = '#D32F2F'; // Merah

      else if (simulatedTEPI >= 60) color = '#F57C00'; // Oren

      else if (simulatedTEPI >= 40) color = '#FBC02D'; // Kuning




      const tooltip = `${r.state}\nSkor TEPI: ${simulatedTEPI.toFixed(1)}\nStatus: ${r.riskCategory}`;

      dataTable.addRow([r.state, simulatedTEPI, color, tooltip]);

    });




    const options = {

      title: '',

      legend: { position: 'none' },

      chartArea: { width: '85%', height: '70%', top: 20, bottom: 45 },

      hAxis: { 

        textStyle: { fontSize: 10, color: '#555' }, 

        slantedText: true, 

        slantedTextAngle: 35 

      },

      vAxis: { 

        title: 'Skor TEPI [0-100]', 

        minValue: 0, 

        maxValue: 100, 

        gridlines: { count: 5, color: '#EDEDED' } 

      },

      animation: { startup: true, duration: 600, easing: 'out' }

    };




    const chart = new google.visualization.ColumnChart(document.getElementById('chart-tepi-ranking'));

    chart.draw(dataTable, options);

  }




  /**

   * Carta 2: Bubble Chart Intensiti Air vs Kualiti Air Marin (MWQI)

   */

  function drawUtilityBubbleChart(records) {

    const dataTable = new google.visualization.DataTable();

    dataTable.addColumn('string', 'ID');

    dataTable.addColumn('number', 'Intensiti Air (m³/pelancong)');

    dataTable.addColumn('number', 'Kualiti Air Marin (MWQI)');

    dataTable.addColumn('string', 'Zon Risiko');

    dataTable.addColumn('number', 'Hutan Simpan (k Ha)');




    records.forEach(r => {

      dataTable.addRow([

        r.state, 

        r.waterIntensity, 

        r.wqi, 

        r.riskCategory.replace(/[^a-zA-Z]/g, '').trim(), 

        r.forest

      ]);

    });




    const options = {

      title: '',

      hAxis: { title: 'Intensiti Air (m³ / pelancong)', gridlines: { color: '#EDEDED' } },

      vAxis: { title: 'Skor Kualiti Air Marin (MWQI [0-100])', gridlines: { color: '#EDEDED' } },

      bubble: { textStyle: { fontSize: 9 } },

      chartArea: { width: '82%', height: '70%', top: 20, bottom: 45 },

      animation: { startup: true, duration: 600, easing: 'out' }

    };




    const chart = new google.visualization.BubbleChart(document.getElementById('chart-bubble-stress'));

    chart.draw(dataTable, options);

  }




  /**

   * Carta 3: Penguraian 5 Komponen Stacked 100%

   */

  function drawStackedDecompositionChart(records) {

    const dataTable = new google.visualization.DataTable();

    dataTable.addColumn('string', 'Negeri');

    dataTable.addColumn('number', 'Pelancongan (30%)');

    dataTable.addColumn('number', 'Penggunaan Air (25%)');

    dataTable.addColumn('number', 'Tekanan Marin (20%)');

    dataTable.addColumn('number', 'Hujan (15%)');

    dataTable.addColumn('number', 'Hutan Simpan (10%)');




    records.forEach(r => {

      dataTable.addRow([

        r.state,

        r.subScores.tourism,

        r.subScores.water,

        r.subScores.wqi,

        r.subScores.climate,

        r.subScores.forest

      ]);

    });




    const options = {

      isStacked: 'percent',

      chartArea: { width: '80%', height: '75%', top: 35, bottom: 30 },

      legend: { position: 'top', maxLines: 2, textStyle: { fontSize: 11 } },

      hAxis: { title: 'Peratus Sumbangan Terhadap Beban Ekologi', minValue: 0, maxValue: 1 },

      vAxis: { textStyle: { fontSize: 10 } },

      colors: ['#29B6F6', '#0288D1', '#8D6E63', '#FFA726', '#66BB6A']

    };




    const chart = new google.visualization.BarChart(document.getElementById('chart-stacked-components'));

    chart.draw(dataTable, options);

  }




  /**

   * Membina Jadual Pemantauan 13 Negeri

   */

  function renderDestinationTable(records, growthRate) {

    const tbody = document.getElementById('table-destinations-body');

    tbody.innerHTML = '';




    records.forEach((r, idx) => {

      const simulatedTourists = r.tourists * (1 + growthRate);

      const simulatedTEPI = Math.min(100, r.tepi * (1 + (growthRate * 0.4)));




      let badgeClass = "bg-success";

      if (simulatedTEPI >= 75) badgeClass = "bg-danger";

      else if (simulatedTEPI >= 60) badgeClass = "bg-warning text-dark";

      else if (simulatedTEPI >= 40) badgeClass = "bg-info text-dark";




      const tr = document.createElement('tr');

      tr.innerHTML = `

        <td class="ps-3 py-2">

          <span class="badge bg-light text-dark border me-1">#${idx + 1}</span> <strong>${r.state}</strong>

        </td>

        <td class="text-center fw-semibold">${simulatedTourists.toFixed(1)} M</td>

        <td class="text-center">${r.water.toLocaleString()} Juta m³</td>

        <td class="text-center fw-semibold text-primary">${r.waterIntensity.toFixed(2)} m³</td>

        <td class="text-center">

          <span class="badge ${badgeClass} badge-tepi">${simulatedTEPI.toFixed(1)}</span>

        </td>

        <td class="text-center">

          <span class="fw-bold small" style="color: ${r.riskColor};">${r.riskCategory}</span>

        </td>

        <td class="pe-3 small text-muted">

          <i class="fa-solid fa-robot text-success me-1"></i> ${r.recommendation}

        </td>

      `;

      tbody.appendChild(tr);

    });

  }




  /**

   * Pemicu Slider Simulasi What-If

   */

  function onSimulationSliderChange(val) {

    const percentage = parseInt(val, 10);

    currentSimulationGrowth = percentage / 100;




    document.getElementById('sim-badge').innerText = `+${percentage}% Pelancong`;




    if (globalDashboardData) {

      updateSimulationOverview(globalDashboardData.kpi, currentSimulationGrowth);

      renderAllCharts(globalDashboardData, currentSimulationGrowth);

      renderDestinationTable(globalDashboardData.records, currentSimulationGrowth);

    }

  }




  function updateSimulationOverview(kpi, growth) {

    const projTourists = kpi.totalTourists * (1 + growth);

    const projWater = kpi.totalWater * (1 + (growth * 1.05));




    document.getElementById('sim-projected-tourists').innerText = projTourists.toFixed(1) + ' M';

    document.getElementById('sim-projected-water').innerText = projWater.toFixed(1) + ' Juta m³';

  }

</script> saya nak awak buatkan macam https://tanistats.dosm.gov.my/ ini saya buat di google apps script https://script.google.com/macros/s/AKfycbyb1O-bNm9wxNxRs07Z-K54anAzR1LLvRR_wxdIGi7Q7ZnIEjoOs2x4n-_ZARPh8n_Awg/exec

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5a977d80-dcf2-4be4-b53a-b1f1f42d1de1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
