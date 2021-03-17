'use strict';

const express =require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const app = express();

require('dotenv').config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.use(expressLayouts);



// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// *******************************

// routs 
app.get('/' , homeHandler);
app.get('/gitonecity' , gitonecityHandler);
app.get('/allcountries' , allcountriesHandler );
app.post('/addrecord' , addrecordHandler);
app.get('/myRecords' , myRecordsHandler);
app.get('/recordDetails/:id' , recordDetailsHandler);
app.delete('/recordDetails/:id', deleteHandler);


// handling

function homeHandler (req,res){
    let url =`https://api.covid19api.com/world/total`;
    
    superagent.get(url)
    .then(data => {
        res.render('pages/home' , {data : data.body});
    })
}

function gitonecityHandler(req,res){
    let {city , from , to } = req.body;
    let url = `https://api.covid19api.com/country/${city}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00`

    superagent.get(url)
    .then(data =>{
        let countyData = data.body.map(city => {
            return new Country(city);
        })
        res.render('pages/getCounrtyResult' , {data : countyData});
    })
}

function allcountriesHandler(req,res){

    let url = `https://api.covid19api.com/summary`;

    superagent.get(url)
    .then((data =>{
        let countryData = data.body.map(city =>{
            return new Cities(city);
        })
        res.render('pages/allcountries' , {data : countryData });
    }))
}

function addrecordHandler(req,res){
    let {country , totalconfirmed , totaldeath ,totalrecovered , date} = req.body;
    let sql = `INSERT INTO country (country , totalconfirmed , totaldeath ,totalrecovered , date)
    VALUES ($1,$2,$3,$4,$5);`;
    let values = [country , totalconfirmed , totaldeath ,totalrecovered , date];

    client.query(sql,values)
    .then(result =>{
        res.redirect('/myRecords');
    })
}

function myRecordsHandler(req,res){

    let sql =`SELECT * FROM country;`;
    client.query(sql)
    .then(result =>{
    if(req.params.id === 0){
        res.send('NO AVAILABLE RECORDS');
    }
    else{
        res.render('pages/myRecords' , {data: result.rows});}
    })
}

function recordDetailsHandler(req,res){
    let id = req.params.id;
    let sql =`SELECT * FROM country WHERE id=$1;`;
    let value = [id];
     
    client.query(sql,value)
    .then(result => {
        res.render('pages/recordDetails' , {item:result.rows[0]});
    })
}
function deleteHandler(req,res){

    let id = req.params.id;
    let sql=`DELETE FROM country WHERE id=$1;`;
    let value = [id];
    client.query(sql,value)
    .then(result =>{
        res.redirect('/myRecords');
    })
}

// constructors

function Country(data){
    
    this.cases=data.Cases;
    this.date=data.date;
}

function Cities (data){
    this.country=data.country;
    this.totalconfirmed= data.totalconfirmed;
    this.totaldeath=data.totaldeath;
    this.totalrecovered=data.totalrecovered;
    this.data=data.date;
}

// ******************************
// Listening 

const PORT = process.env.PORT || 3030;

client.connect()
.then(() =>{
    app.listen(PORT , () =>{
        console.log(`http://localhost:${PORT}`);
    });
});