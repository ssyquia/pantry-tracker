'use client'

import { useState, useEffect } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { Box, Stack, Typography, Button, Modal, TextField, CssBaseline, useMediaQuery } from '@mui/material'
import { firestore } from '@/firebase'
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc } from 'firebase/firestore'

const theme = createTheme({
  palette: {
    primary: {
      main: '#0D47A1',
    },
    secondary: {
      main: '#E3F2FD',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: 'clamp(2rem, 4vw, 3rem)',  // Responsive font size
    },
    h2: {
      fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',  // Responsive font size
    },
    h3: {
      fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
    },
    h5: {
      fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', // Responsive font size
    }
  },
  shape: {
    borderRadius: 12,
  },
})

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  borderRadius: '15px',
}

const addItemButtonStyle = {
  padding: '10px 20px',
  fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',  // Responsive font size
  backgroundColor: '#4CAF50',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '12px',
  '&:hover': {
    backgroundColor: '#45A049',
  },
}

const quantityControlsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

const quantityButtonStyle = {
  height: '24px',
  fontSize: '1.2rem',
  color: '#FFFFFF',
  borderRadius: '20px',
  minWidth: 0,
}

const addQuantityStyle = {
  backgroundColor: '#4CAF50',
  '&:hover': {
    backgroundColor: '#45A049',
  },
}

const subtractQuantityStyle = {
  backgroundColor: '#f44336',
  '&:hover': {
    backgroundColor: '#d32f2f',
  },
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isShortScreen = useMediaQuery('(max-height: 720px)')

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
  }
  
  useEffect(() => {
    updateInventory()
  }, [])

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1 })
    } else {
      await setDoc(docRef, { quantity: 1 })
    }
    await updateInventory()
  }
  
  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      }
    }
    await updateInventory()
  }

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  // Filter inventory based on search query
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        width="100vw"
        height="100vh"
        display={'flex'}
        justifyContent={isShortScreen ? 'flex-start' : 'center'}
        flexDirection={'column'}
        alignItems={'center'}
        bgcolor={'#FFFFFF'}
        gap={2}
        sx={{ overflow: 'auto' }}
      >
        <Box 
          className={isShortScreen ? 'short-screen-card' : ''}
          sx={{ 
            width: { xs: '100%', sm: '85%', md: '65%' }, 
            p: { xs: 2, sm: 3, md: 4 }, 
            bgcolor: isMobile ? 'transparent' : '#F0F0F0', 
            boxShadow: isMobile ? 'none' : 6, 
            borderRadius: isMobile ? 0 : 3, 
            border: isMobile ? 'none' : '1px solid #ddd',
          }}
        >
          <Typography variant="h1" color="black" mb={4} fontWeight="bold">
            Pantry Tracker 🥕
          </Typography>
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={modalStyle}>
              <Typography id="modal-modal-title" variant="h5" fontWeight="bold" component="h2" color="black" mb={2}>
                Add Item
              </Typography>
              <Stack width="100%" direction={'row'} spacing={3}>
                <TextField
                  id="outlined-basic"
                  label="Item"
                  variant="outlined"
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    addItem(itemName)
                    setItemName('')
                    handleClose()
                  }}
                  sx={addItemButtonStyle}
                >
                  Add
                </Button>
              </Stack>
            </Box>
          </Modal>
          <Box display="flex" justifyContent="space-between" mb={3}>
            <TextField
              label="Search"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ bgcolor: 'white', fontSize: '1.2rem', width: '40%' }}
            />
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleOpen} 
              sx={addItemButtonStyle}
            >
              Add New Item
            </Button>
          </Box>
          <Box 
            bgcolor="white" 
            width="100%" 
            borderRadius="15px"
            sx={{ 
              p: { sm: 2 },
              borderRadius: 2, 
              border: { sm: 0, md: '1px solid #ddd' }
            }}
          >
            <Box
              width="100%"
              height="100px"
              bgcolor={'#0D47A1'}
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
              borderRadius="15px"
            >
              <Typography variant="h3" fontWeight={500} color="white" textAlign="center">
                Inventory Items
              </Typography>
            </Box>
            <Stack width="100%" height="300px" overflow={'auto'} bgcolor="white">
              {filteredInventory.map(({name, quantity}) => (
                <Box
                  key={name}
                  width="100%"
                  minHeight="100px"
                  display={'flex'}
                  justifyContent={'space-between'}
                  alignItems={'center'}
                  bgcolor={'#E3F2FD'}
                  paddingX={{xs: 2, md: 5}}
                  borderRadius="15px"
                  mb={2}
                >
                  <Typography variant="h5" color="primary" textAlign="center">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Box sx={quantityControlsStyle}>
                    <Typography variant="h5" color="primary" textAlign="center">
                      Quantity:
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => removeItem(name)}
                      sx={{ ...subtractQuantityStyle, ...quantityButtonStyle }}
                    >
                      -
                    </Button>
                    <Typography variant="h5" color="primary" textAlign="center">
                      {quantity}
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => addItem(name)}
                      sx={{ ...addQuantityStyle, ...quantityButtonStyle }}
                    >
                      +
                    </Button>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}