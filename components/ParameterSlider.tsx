import Slider from '@react-native-community/slider'
import {StyleSheet, Text, View} from 'react-native'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
}

export function ParameterSlider({label, value, min, max, step, display, onChange}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{display}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#888"
        maximumTrackTintColor="#333"
        thumbTintColor="#bbb"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {flexDirection: 'column', gap: 2, width: 148},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline'},
  label: {color: '#777', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase'},
  value: {color: '#aaa', fontSize: 11, fontVariant: ['tabular-nums']},
  slider: {width: '100%', height: 28},
})
