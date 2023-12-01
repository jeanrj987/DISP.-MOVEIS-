import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, TextInput } from 'react-native';
import { Text } from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import * as Calendar from 'expo-calendar';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import useWebSocket from 'react-use-websocket';

const availableCryptos = [
  { label: 'Bitcoin (BTC)', value: 'btcusdt' },
  { label: 'Ethereum (ETH)', value: 'ethusdt' },
  { label: 'Binance Coin (BNB)', value: 'bnbusdt' },
  { label: 'Cardano (ADA)', value: 'adausdt' },
  { label: 'Ripple (XRP)', value: 'xrpusdt' },
  { label: 'Polkadot (DOT)', value: 'dotusdt' },
];

const App = () => {
  //criptomoeda selecionada
  const [selectedCrypto, setSelectedCrypto] = useState(availableCryptos[0].value);
  const [data, setData] = useState({});
  const [ location,setLocation] = useState(null);
  // nome do evento
  const [eventName, setEventName] = useState('');
  // controlar a visibilidade do seletor de data e hora
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  //  data e hora selecionadas
  const [selectedDate, setSelectedDate] = useState(new Date());

  // funcao para obter o sinal de alteracao de preco
  const getSignal = (value) => (value > 0 ? '+' : value < 0 ? '-' : '');

  // WebSocket
  const { lastJsonMessage } = useWebSocket(
    `wss://stream.binance.com:9443/ws/${selectedCrypto}@ticker`,
    {
      onMessage: (event) => {
        // recebe mensagens do websocket
        const message = JSON.parse(event.data);
        // console.log('Mensagem WebSocket:', message); comentado pq fica atualizando no cmd
        if (message) {
          setData({
            priceChange: parseFloat(message.p),
            priceChangePercent: parseFloat(message.P),
            close: message.c,
            high: message.h,
            low: message.l,
            quoteVolume: message.q,
          });
        }
      },
      onError: (event) => console.error('Erro no WebSocket:', event),
      shouldReconnect: () => true,
      reconnectInterval: 3000,
    }
  );

  // adicionar um evento no calendario
  const addEventToCalendar = async () => {
    try {
      // solicita permissao para acessar o calendário
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      // lista do calendario
      const calendars = await Calendar.getCalendarsAsync();
      const targetCalendar = calendars[0]; // primeiro calendario do mes

      // detalhes do evento adicionado destaca como evento importante
      const eventDetails = {
        title: eventName || 'Evento Importante',
        startDate: selectedDate,
        endDate: new Date(selectedDate.getTime() + 60 * 60 * 1000), // uma hora de evento
        location: 'Local do Evento',
      };

      // cria o evento no calendario
      const eventId = await Calendar.createEventAsync(targetCalendar.id, eventDetails);

      console.log('Evento Adicionado, ID:', eventId);

      //mensagem de alert mais o id quando o evento é adicionado
      alert(`Evento adicionado ao calendário com ID: ${eventId}`);
    } catch (error) {
      console.error('Erro ao adicionar evento ao calendário:', error);
    }
  };

  // exibi o seletor de data e hora
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  //oculta o seletor de data e hora
  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  // chamada quando a data e hora são confirmadas
  const handleDateConfirm = (date) => {
    hideDatePicker();
    setSelectedDate(date);
  };

  //efeito para obter permissão de localizacao
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        // pede permissao da localizacao
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permissão de localização não concedida');
          return;
        }

        // localizacao atual
        const locationResult = await Location.getCurrentPositionAsync({});
        setLocation(locationResult.coords);
      } catch (error) {
        console.error('Erro ao obter a localização:', error);
      }
    };

    // chama a funcao para permitir o acesso da localizacao
    requestLocationPermission();
  }, []); // o array vazio indica que este efeito é executado uma vez

  // renderizacao do componente
  return (
    <View style={styles.container}>
  <View style={styles.content}>
    <Text h1 style={styles.headerText}>
      CryptoTracker
    </Text>
    
    {/* componente que permite selecionar uma criptomoeda*/ }
      <Picker
        selectedValue={selectedCrypto}  // valor atual
        onValueChange={(itemValue) => setSelectedCrypto(itemValue)}  // atualiza o estado com o valor selecionado
        style={styles.picker} 
      >

      {/*mapeia as opcoes de criptomoedas disponiveis */} 
      {availableCryptos.map((crypto) => (
        <Picker.Item key={crypto.value} label={crypto.label} value={crypto.value} />
      ))}
      </Picker>


          {[
      { label: 'Preço Atual', value: `R$ ${parseFloat(data.close).toFixed(2)}`, style: styles.price },
      //mostra a alteracao no preco e  alteracao percentual
      { label: 'Alteração', value: `${getSignal(data.priceChange)} ${data.priceChange} (${getSignal(data.priceChangePercent)} ${data.priceChangePercent}%)`, style: styles.change },
      { label: 'Mínima 24h', value: data.low },
      { label: 'Máxima 24h', value: data.high },
    ].map((item, index) => (
      // cada item é renderizado como se fosse uma linha de componente
      <View key={index} style={styles.line}>
        <Text style={styles.bold}>{item.label}: </Text>
        <Text style={item.style}>{item.value}</Text>
      </View>
    ))}

  </View>

  <View style={styles.calendario}>
    <TextInput
      style={styles.input}
      placeholder="Nome do Evento"
      value={eventName}
      onChangeText={(text) => setEventName(text)}
    />
  </View>

  <View style={styles.buttonEscolherData}>
    <Button title="Escolher Data" onPress={showDatePicker} />
    <DateTimePickerModal
      isVisible={isDatePickerVisible}
      mode="datetime"
      onConfirm={handleDateConfirm}
      onCancel={hideDatePicker}
    />
  </View>

  <View style={styles.buttonbuttonAdicionarEvento}>
    <Button
      title="Adicionar Evento ao Calendário"
      onPress={addEventToCalendar}
    />
  </View>
</View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 20,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    elevation: 5,
  },
  headerText: {
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  picker: {
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#eee',
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 10,
  },
  bold: {
    fontWeight: 'bold',
    color: '#555',
  },
  price: {
    color: '#27ae60',
  },
  change: {
    color: '#e74c3c',
  },
  calendario: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  buttonbuttonAdicionarEvento: {
    padding: 2,
    margin: 25,
  },
  buttonEscolherData: {
    margin: 25,
    padding: 2,
  },
});

// Exporta o componente principal
export default App;
