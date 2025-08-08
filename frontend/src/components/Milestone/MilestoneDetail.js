import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Descriptions, 
  Tag, 
  Progress, 
  List, 
  Empty, 
  Spin, 
  message,
  Modal,
  Form,
  Input,
  DatePicker
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  CalendarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import './MilestoneDetail.css';

const { TextArea } = Input;

const MilestoneDetail = ({ user }) => {
  const { milestoneId } = useParams();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (milestoneId) {
      fetchMilestoneDetail();
      fetchSubtasks();
    }
  }, [milestoneId]);

  const fetchMilestoneDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/milestones/getMilestoneDetail/${milestoneId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setMilestone(result.data);
      } else {
        message.error('获取里程碑详情失败：' + result.message);
      }
    } catch (error) {
      console.error('获取里程碑详情失败:', error);
      message.error('网络错误，请重试');
    }
  };

  const fetchSubtasks = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/subtasks/getSubtaskList/${milestoneId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setSubtasks(result.data || []);
      } else {
        console.log('获取子任务失败:', result.message);
      }
    } catch (error) {
      console.error('获取子任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    form.setFieldsValue({
      title: milestone.title,
      description: milestone.description,
      startDate: milestone.startDate ? dayjs(milestone.startDate) : null,
      endDate: milestone.endDate ? dayjs(milestone.endDate) : null,
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async (values) => {
    try {
      const token = localStorage.getItem('token');
      
      const formData = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
      };

      const response = await fetch(`http://localhost:5000/api/milestones/updateMilestone/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        message.success('里程碑更新成功');
        setEditModalVisible(false);
        fetchMilestoneDetail();
      } else {
        message.error('更新失败：' + result.message);
      }
    } catch (error) {
      console.error('更新里程碑失败:', error);
      message.error('更新失败，请重试');
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个里程碑吗？此操作不可恢复。',
      okText: '确定删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          
          const response = await fetch(`http://localhost:5000/api/milestones/deleteMilestone/${milestoneId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();
          
          if (result.success) {
            message.success('里程碑删除成功');
            navigate(-1);
          } else {
            message.error('删除失败：' + result.message);
          }
        } catch (error) {
          console.error('删除里程碑失败:', error);
          message.error('删除失败，请重试');
        }
      }
    });
  };

  const getStatusTag = (milestone) => {
    if (!milestone.startDate || !milestone.endDate) {
      return <Tag color="default">未设置时间</Tag>;
    }
    
    const now = new Date();
    const startDate = new Date(milestone.startDate);
    const endDate = new Date(milestone.endDate);
    
    if (now < startDate) {
      return <Tag color="blue">未开始</Tag>;
    } else if (now > endDate) {
      return <Tag color="red">已结束</Tag>;
    } else {
      return <Tag color="green">进行中</Tag>;
    }
  };

  const calculateProgress = () => {
    if (subtasks.length === 0) return 0;
    const completedTasks = subtasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / subtasks.length) * 100);
  };

  if (loading) {
    return (
      <div className="milestone-loading">
        <Spin size="large" />
        <p>加载里程碑详情...</p>
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="milestone-error">
        <Empty description="里程碑不存在" />
        <Button onClick={() => navigate(-1)}>返回</Button>
      </div>
    );
  }

  return (
    <div className="milestone-detail-container">
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="back-button"
        >
          返回
        </Button>
        <div className="header-content">
          <h1>{milestone.title}</h1>
          <div className="header-meta">
            {getStatusTag(milestone)}
            <span className="progress-text">完成度: {calculateProgress()}%</span>
          </div>
        </div>
        <div className="header-actions">
          <Button icon={<EditOutlined />} onClick={handleEdit}>
            编辑
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除
          </Button>
        </div>
      </div>

      <div className="milestone-content">
        <Card className="milestone-info-card" title="里程碑信息">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="标题" span={2}>
              {milestone.title}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {milestone.description || '暂无描述'}
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              <div className="date-item">
                <CalendarOutlined />
                {milestone.startDate ? new Date(milestone.startDate).toLocaleDateString() : '未设置'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="结束时间">
              <div className="date-item">
                <CalendarOutlined />
                {milestone.endDate ? new Date(milestone.endDate).toLocaleDateString() : '未设置'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(milestone.createTime).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="完成进度">
              <Progress percent={calculateProgress()} size="small" />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card 
          className="subtasks-card" 
          title="子任务列表"
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate(`/subtasks/create?milestoneId=${milestoneId}`)}
            >
              添加子任务
            </Button>
          }
        >
          {subtasks.length === 0 ? (
            <Empty description="暂无子任务" />
          ) : (
            <List
              dataSource={subtasks}
              renderItem={subtask => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      onClick={() => navigate(`/subtasks/${subtask.subtaskId}`)}
                    >
                      查看详情
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      subtask.status === 'completed' ? 
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} /> :
                        <div className="task-status-dot" />
                    }
                    title={subtask.title}
                    description={
                      <div>
                        <p>{subtask.description}</p>
                        <div className="subtask-meta">
                          <Tag color={subtask.status === 'completed' ? 'green' : 'blue'}>
                            {subtask.status === 'completed' ? '已完成' : '进行中'}
                          </Tag>
                          {subtask.assignee && (
                            <span>负责人: {subtask.assignee}</span>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>

      <Modal
        title="编辑里程碑"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            label="开始时间"
            name="startDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="结束时间"
            name="endDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <div className="modal-actions">
            <Button onClick={() => setEditModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MilestoneDetail;