const { ApiPromise, WsProvider, HttpProvider} = require('@polkadot/api');

const main = async () => {

    const wsProvider = new HttpProvider('https://rpc.polkadot.io');
    const api = await ApiPromise.create({provider: wsProvider});
    console.log('api',api)
    const resp = await api.query.system.account('14W6rFMtkvHKwUFhG69Y8qcCx67QuaeHaZwiAQBcahuCz8Cg');
    console.log('repss',resp?.data.free?.toString())
}
main()
