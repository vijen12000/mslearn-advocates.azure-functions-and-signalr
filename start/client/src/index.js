import './style.css';

function getApiUrl() {

    const backend = process.env.BACKEND_URL;
    
    const url = (backend) ? `${backend}` : ``;
    return url;
}

const app = new Vue({
    el: '#app',
    interval: null,
    data() { 
        return {
            stocks: []
        }
    },
    methods: {
        async update() {
            try {
                
                const url = `${getApiUrl()}/api/getStocks`;
                console.log('Fetching stocks from ', url);

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                app.stocks = await response.json();
            } catch (ex) {
                console.error(ex);
            }
        },
        startPoll() {
            this.interval = setInterval(this.update, 5000);
        }
    },
    created() {
        this.update();
        this.startPoll();
    }
});

const connect = () => {

    const signalR_URL = `${getApiUrl()}/api`;
    console.log(`Connecting to SignalR...${signalR_URL}`)

    const connection = new signalR.HubConnectionBuilder()
                            .withUrl(signalR_URL)
                            .configureLogging(signalR.LogLevel.Information)
                            .build();

    connection.onclose(()  => {
        console.log('SignalR connection disconnected');
        setTimeout(() => connect(), 2000);
    });

    connection.on('updated', updatedStock => {
        console.log('Stock updated message received', updatedStock);
        const index = app.stocks.findIndex(s => s.id === updatedStock.id);
        console.log(`${updatedStock.symbol} Old price: ${app.stocks[index].price}, New price: ${updatedStock.price}`);
        app.stocks.splice(index, 1, updatedStock);
    });

    connection.start().then(() => {
        console.log("SignalR connection established");
    });
};

connect();