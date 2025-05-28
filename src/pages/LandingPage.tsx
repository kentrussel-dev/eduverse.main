import { motion } from 'framer-motion';
import styled from '@emotion/styled';
import { Box, Container, Typography, Button } from '@mui/material';

const GradientBackground = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2a1b3d 100%);
  min-height: 100vh;
  color: white;
  overflow: hidden;
`;

const WavySection = styled.div`
  position: relative;
  background: #2a1b3d;
  padding: 100px 0;
  margin-top: 100px;
  &::before {
    content: '';
    position: absolute;
    top: -50px;
    left: 0;
    width: 100%;
    height: 50px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%232a1b3d' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") no-repeat;
    background-size: cover;
  }
`;

const ImageContainer = styled(motion.div)`
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  height: 400px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.5);
  &::after {
    content: 'Image Placeholder';
  }
`;

export const LandingPage = () => {
    return (
        <GradientBackground>
            <Container>
                <Box sx={{ pt: 15, pb: 10 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Typography variant="h2" sx={{
                            fontWeight: 'bold',
                            mb: 2,
                            background: 'linear-gradient(45deg, #fff, #8b5cf6)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                        }}>
                            Unlock Your Learning Potential
                        </Typography>
                        <Typography variant="h5" sx={{ mb: 4, color: 'rgba(255,255,255,0.8)' }}>
                            Join EduVerse to transform your educational journey with interactive learning experiences
                        </Typography>
                    </motion.div>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 4,
                            mt: 4
                        }}
                    >
                        <Box>
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                <ImageContainer />
                            </motion.div>
                        </Box>
                        <Box>
                            <Box sx={{ pl: { md: 4 }, pt: { xs: 2, md: 8 } }}>
                                <motion.div
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                >
                                    <Typography variant="h4" sx={{ mb: 3 }}>
                                        Immersive Learning Environment
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>
                                        Experience education like never before with our cutting-edge virtual classrooms and interactive learning tools.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        sx={{
                                            background: 'linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)',
                                            color: 'white',
                                            px: 4,
                                            py: 1.5,
                                        }}
                                    >
                                        Start Learning
                                    </Button>
                                </motion.div>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Container>

            <WavySection>
                <Container>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 6,
                            alignItems: 'center'
                        }}
                    >
                        <Box>
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                            >
                                <Typography variant="h3" sx={{ mb: 4 }}>
                                    Learn Together, Grow Together
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>
                                    Join a community of learners and educators passionate about knowledge sharing and growth.
                                </Typography>
                            </motion.div>
                        </Box>
                        <Box>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                            >
                                <ImageContainer />
                            </motion.div>
                        </Box>
                    </Box>
                </Container>
            </WavySection>
        </GradientBackground>
    );
};
