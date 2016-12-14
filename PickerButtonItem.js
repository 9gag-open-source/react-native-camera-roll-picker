
import React, {Component} from 'react'
import {
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  View
} from 'react-native'

class PickerButtonItem extends Component {

  componentWillMount () {
    var {width} = Dimensions.get('window')
    var {imageMargin, imagesPerRow, containerWidth} = this.props
    if (typeof containerWidth !== 'undefined') {
      width = containerWidth
    }
    this._imageSize = (width - (imagesPerRow - 1) * imageMargin) / imagesPerRow
  }

  render () {
    var {item, imageMargin, source, text, tintColor} = this.props
    console.log("tintColor", tintColor);
    return (
      <TouchableOpacity
        style={{marginBottom: imageMargin, marginRight: imageMargin}}
        onPress={() => this._handleClick(item)}>
        <View style={[styles.imageWrapper, {height: this._imageSize, width: this._imageSize}]}>
          <Image source={source} style={[styles.image, {tintColor: tintColor}]} />
        </View>
        <Text style={[styles.text, {textAlign: 'center', width: this._imageSize, color: tintColor}]}>{text}</Text>
      </TouchableOpacity>
    )
  }

  _handleClick (item) {
    this.props.onClick(item)
  }
}

const styles = StyleSheet.create({
  image: {
    width: 40,
    height: 40,
    resizeMode: 'contain'
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  text: {
    position: 'absolute',
    bottom: 10,
    fontSize: 14,
  }
})

PickerButtonItem.propTypes = {
  item: React.PropTypes.string,
  onClick: React.PropTypes.func
}

export default PickerButtonItem
