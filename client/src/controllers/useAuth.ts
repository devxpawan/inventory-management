import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/users`;

export const useLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await axios.post(`${API_URL}/login`, credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('userInfo', JSON.stringify(data));
      toast({
        title: 'Login Successful',
        description: 'You have been successfully logged in.',
      });
      navigate('/'); // Redirect to dashboard
    },
    onError: (error: any) => {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message || 'An error occurred during login.',
        variant: 'destructive',
      });
    },
  });
};

export const useRegister = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userData: { username: string; password: string; role?: string }) => {
      const response = await axios.post(`${API_URL}/register`, userData);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Registration Successful',
        description: 'User has been successfully registered.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.message || 'An error occurred during registration.',
        variant: 'destructive',
      });
    },
  });
};

export const useAddSubAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: { username: string; password: string }) => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.post(`${API_URL}/subadmin`, userData, config);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Sub-admin Added',
        description: 'New sub-admin has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['subAdmins'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Add Sub-admin',
        description: error.response?.data?.message || 'An error occurred while adding sub-admin.',
        variant: 'destructive',
      });
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const logout = () => {
    localStorage.removeItem('userInfo');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    navigate('/login');
  };

  return logout;
};

export const useSubAdmins = () => {
  const userInfoString = localStorage.getItem('userInfo');
  const userInfo = userInfoString ? JSON.parse(userInfoString) : null;

  return useQuery({
    queryKey: ['subAdmins'],
    queryFn: async () => {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`${API_URL}/subadmins`, config);
      return response.data;
    },
    enabled: !!userInfo?.token && userInfo?.role === 'superadmin', // Only fetch if logged in and is superadmin
  });
};

export const useDeleteSubAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Import useQueryClient

  return useMutation({
    mutationFn: async (id: string) => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.delete(`${API_URL}/subadmin/${id}`, config);
    },
    onSuccess: () => {
      toast({
        title: 'Sub-admin Deleted',
        description: 'Sub-admin has been successfully removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['subAdmins'] }); // Invalidate to refetch sub-admins
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion Failed',
        description: error.response?.data?.message || 'An error occurred while deleting sub-admin.',
        variant: 'destructive',
      });
    },
  });
};

export const useChangeSubAdminPassword = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.put(`${API_URL}/subadmin/${id}/change-password`, { password }, config);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Password Updated',
        description: "Sub-admin's password has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['subAdmins'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.response?.data?.message || 'An error occurred while updating the password.',
        variant: 'destructive',
      });
    },
  });
};
